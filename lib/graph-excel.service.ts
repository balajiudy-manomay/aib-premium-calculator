import { getGraphClient, getGraphToken } from "./graph-client";
import { excelMapping } from "@/config/excel-mapping";
import * as https from "https";
import { URL } from "url";

/**
 * Robust native HTTPS GET request to bypass Next.js fetch polyfill bugs
 * specifically related to 302 redirects to SharePoint CDNs.
 */
function httpsGetBuffer(requestUrl: string, token?: string, redirectCount = 0): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error("Too many redirects"));

    const parsedUrl = new URL(requestUrl);
    const options: https.RequestOptions = { method: "GET", headers: {} as Record<string, string> };
    if (token) (options.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

    const req = https.request(parsedUrl, options, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Drop auth token on redirect to SharePoint CDN if it's a different origin to avoid 401s, 
        // but for Graph API we typically re-use the token unless it's a pre-auth URL
        return resolve(httpsGetBuffer(res.headers.location, token, redirectCount + 1));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP error: ${res.statusCode} ${res.statusMessage}`));
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const fullBuffer = Buffer.concat(chunks);
        resolve(fullBuffer.buffer.slice(fullBuffer.byteOffset, fullBuffer.byteOffset + fullBuffer.byteLength));
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    req.setTimeout(60000);
    req.end();
  });
}

let cachedDriveId: string | null = null;
let cachedItemId: string | null = null;
let cachedParentId: string | null = null;

export async function getWorkbookIds(): Promise<{ driveId: string, itemId: string, parentId: string }> {
  if (cachedDriveId && cachedItemId && cachedParentId) {
    return { driveId: cachedDriveId, itemId: cachedItemId, parentId: cachedParentId };
  }

  const sharepointUrl = process.env.SHAREPOINT_URL;
  if (!sharepointUrl) {
    const fallbackDriveId = process.env.SHAREPOINT_DRIVE_ID;
    const fallbackItemId = process.env.SHAREPOINT_ITEM_ID;
    if (fallbackDriveId && fallbackItemId) {
      return { driveId: fallbackDriveId, itemId: fallbackItemId, parentId: '' };
    }
    throw new Error("SHAREPOINT_URL is not defined in environment variables");
  }

  const client = await getGraphClient();
  const encodedUrl = Buffer.from(sharepointUrl).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const token = `u!${encodedUrl}`;
  
  const driveItem = await client.api(`/shares/${token}/driveItem`).get();
  
  cachedDriveId = driveItem.parentReference.driveId;
  cachedItemId = driveItem.id;
  cachedParentId = driveItem.parentReference.id;
  
  if (!cachedDriveId || !cachedItemId) {
    throw new Error("Failed to resolve SharePoint URL to Drive and Item IDs");
  }
  
  return { driveId: cachedDriveId, itemId: cachedItemId, parentId: cachedParentId || '' };
}

const getWorkbookPath = async () => {
  const { driveId, itemId } = await getWorkbookIds();
  return `/drives/${driveId}/items/${itemId}/workbook`;
};

/**
 * Creates a new session for the workbook to isolate changes.
 */
export async function createSession(): Promise<string> {
  const client = await getGraphClient();
  const response = await client.api(`${await getWorkbookPath()}/createSession`).post({ persistChanges: false });
  return response.id;
}

/**
 * Closes the workbook session.
 */
export async function closeSession(sessionId: string): Promise<void> {
  const client = await getGraphClient();
  await client.api(`${await getWorkbookPath()}/closeSession`)
    .header("workbook-session-id", sessionId)
    .post({});
}

/**
 * Populates inputs into the Excel file using the Graph API.
 */
export async function populateInputs(
  sessionId: string | null, 
  payload: Record<string, any>, 
  targetItemId?: string
): Promise<void> {
  const { driveId, itemId } = await getWorkbookIds();
  const finalTargetItemId = targetItemId || itemId;
  const client = await getGraphClient();
  const sheetName = excelMapping.sheetName;
  
  const promises = Object.entries(payload).map(async ([key, value]) => {
    const mapping = excelMapping.inputs[key];
    if (!mapping) return;
    
    let cellValue = value;
    if (value !== undefined && value !== null) {
      if (value === "") {
        cellValue = "";
      } else if (mapping.type === "number" || mapping.type === "currency") {
        cellValue = Number(value);
      } else if (mapping.type === "boolean") {
        cellValue = Boolean(value);
      } else if (mapping.type === "date") {
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
          const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
          const day = String(parsedDate.getDate()).padStart(2, "0");
          const year = parsedDate.getFullYear();
          cellValue = `${month}/${day}/${year}`;
        } else {
          cellValue = "";
        }
      }
      
      let request = client.api(`/drives/${driveId}/items/${finalTargetItemId}/workbook/worksheets('${sheetName}')/range(address='${mapping.cell}')`);
      if (sessionId) {
        request = request.header("workbook-session-id", sessionId);
      }
      
      await request.patch({
        values: [[cellValue]]
      });
    }
  });

  await Promise.all(promises);
}

/**
 * Reads outputs from the Excel file using the Graph API.
 */
export async function readOutputs(sessionId: string, mappingObject: Record<string, any> = excelMapping.outputs): Promise<Record<string, any>> {
  const client = await getGraphClient();
  const sheetName = excelMapping.sheetName;
  const result: Record<string, any> = {};

  const entries = Object.entries(mappingObject);
  
  // We use sequential fetches to avoid hitting rate limits too quickly, 
  // but this can be optimized with batching if necessary.
  for (const [key, mapping] of entries) {
    if (mapping && typeof mapping === "object") {
      if (mapping.type === "dynamic_list" && mapping.range) {
        const response = await client.api(`${await getWorkbookPath()}/worksheets('${sheetName}')/range(address='${mapping.range}')`)
          .header("workbook-session-id", sessionId)
          .get();
        
        const list: Array<{ insurer: string, premium: number }> = [];
        if (response && response.values) {
          for (const row of response.values) {
            const insurerName = row[0];
            const premium = row[1];
            
            // If the insurer name is empty or falsy, stop reading
            if (!insurerName || String(insurerName).trim() === "") {
              break;
            }
            
            list.push({
              insurer: String(insurerName).trim(),
              premium: Number(premium) || 0
            });
          }
        }
        result[key] = list;
      } else if ("cell" in mapping) {
        const response = await client.api(`${await getWorkbookPath()}/worksheets('${sheetName}')/range(address='${mapping.cell}')`)
          .header("workbook-session-id", sessionId)
          .get();
        
        // Graph API returns a 2D array for values
        result[key] = response.values[0][0];
      } else {
        result[key] = await readOutputs(sessionId, mapping);
      }
    }
  }

  return result;
}

/**
 * Fetches the list of vehicles from the 'Reference Sheet' via Graph API.
 */
export async function getVehicles(): Promise<string[]> {
  const client = await getGraphClient();
  
  // We can just fetch a large range or used range of column R. 
  // Let's assume up to R1000 is enough, or use usedRange if needed.
  // Using a fixed range like R3:R5000 is fast enough and simple.
  const response = await client.api(`${await getWorkbookPath()}/worksheets('Reference Sheet')/range(address='R3:R30000')`).get();
  
  const vehicles: string[] = [];
  if (response && response.values) {
    for (const row of response.values) {
      const val = row[0];
      if (val !== null && val !== undefined) {
        const strVal = String(val).trim();
        if (strVal) {
          vehicles.push(strVal);
        }
      }
    }
  }
  
  // Deduplicate
  return Array.from(new Set(vehicles));
}

/**
 * Downloads the raw Excel file buffer directly from SharePoint.
 * This is useful for creating copies or reading unmutated defaults.
 */
export async function getRawFileBuffer(): Promise<ArrayBuffer> {
  try {
    console.log("STEP 1: Starting getRawFileBuffer");

    console.log("STEP 2: Getting token");
    const token = await getGraphToken();

    console.log("STEP 3: Token received");

    const { driveId, itemId } = await getWorkbookIds();
    console.log("STEP 4: driveId =", driveId);
    console.log("STEP 5: itemId =", itemId);

    const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/content`;

    console.log("STEP 6: URL =", url);

    console.log("STEP 7: About to fetch (using native https bypass)");

    // Using pure native HTTPS to completely bypass Next.js fetch/undici bugs
    const arrayBuffer = await httpsGetBuffer(url, token);

    console.log("STEP 8: Response received successfully");
    
    return arrayBuffer;
  } catch (error: any) {
    console.error("FULL ERROR IN getRawFileBuffer:");
    console.error(error);
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
    throw error;
  }
}

/**
 * Fetches the premium breakdown for a specific insurer or all insurers.
 * If sessionId is provided, fetches the breakdown for the populated session.
 * If insurer is provided, returns only that insurer's breakdown.
 */
export async function getBreakdowns(sessionId: string | null, insurer?: string): Promise<Record<string, any>> {
  const client = await getGraphClient();
  const sheetName = "Quick Quote Cal_Breakdown";
  
  // 1. Fetch the dynamic headers from row 4 starting at Column C
  let headerRequest = client.api(`${await getWorkbookPath()}/worksheets('${sheetName}')/range(address='C4:Z4')`);
  if (sessionId) {
    headerRequest = headerRequest.header("workbook-session-id", sessionId);
  }
  const headerResponse = await headerRequest.get();
  const headerRow = headerResponse.values?.[0] || [];

  // Match function to compare key (e.g. graceKennedy or bcic) against header name (e.g. "British Caribbean Insurance Company")
  const matchesInsurer = (headerName: string, queryKey: string): boolean => {
    const cleanHeader = headerName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanQuery = queryKey.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanHeader === cleanQuery || cleanHeader.includes(cleanQuery) || cleanQuery.includes(cleanHeader)) {
      return true;
    }

    // Acronym matching (e.g. "British Caribbean Insurance Company" -> "bcic")
    const words = headerName.split(/[\s_-]+/);
    const acronym = words.map(w => w.charAt(0)).join("").toLowerCase();
    if (acronym === cleanQuery) {
      return true;
    }

    // Try stripping common words like "Insurance", "Company", "Limited", "General"
    const cleanWords = words.filter(w => !["insurance", "company", "limited", "general", "ltd", "co"].includes(w.toLowerCase()));
    const cleanAcronym = cleanWords.map(w => w.charAt(0)).join("").toLowerCase();
    if (cleanAcronym === cleanQuery) {
      return true;
    }

    // Try matching if the query has underscores/camelcase
    const cleanQueryWords = queryKey.split(/[\s_-]+/);
    const queryAcronym = cleanQueryWords.map(w => w.charAt(0)).join("").toLowerCase();
    if (acronym === queryAcronym) {
      return true;
    }

    return false;
  };

  // Helper to map dynamic name to a camelCase key dynamically (e.g. "Sagicor General" -> "sagicorGeneral")
  const matchInsurerKey = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return "unknown";
    const firstWord = words[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const otherWords = words.slice(1).map(w => {
      const cleanW = w.replace(/[^a-zA-Z0-9]/g, "");
      return cleanW.charAt(0).toUpperCase() + cleanW.slice(1).toLowerCase();
    }).join("");
    
    return firstWord + otherWords;
  };

  const activeInsurerKeys: string[] = [];
  const dynamicInsurerColumns: Record<string, number> = {};
  const indexToHeaderName: Record<string, string> = {}; // Map key -> original header name
  
  headerRow.forEach((val: any, index: number) => {
    if (val && typeof val === "string" && val.trim() !== "") {
      const name = val.trim();
      const matchedKey = matchInsurerKey(name) || name;
      dynamicInsurerColumns[matchedKey] = index + 2;
      activeInsurerKeys.push(matchedKey);
      indexToHeaderName[matchedKey] = name;
    }
  });

  let request = client.api(`${await getWorkbookPath()}/worksheets('${sheetName}')/usedRange`);
  if (sessionId) {
    request = request.header("workbook-session-id", sessionId);
  }
  
  const response = await request.get();
  
  // Build a row cache for Column B
  const rowCache: Record<string, number> = {};
  const values: any[][] = response.values || [];
  
  values.forEach((row, rowIndex) => {
    // Column B is index 1
    const val = row[1];
    if (val && typeof val === "string") {
      rowCache[val.trim().toLowerCase()] = rowIndex;
    }
  });

  const { breakdownLabels } = await import("@/config/excel-mapping");
  
  const extractBreakdown = (insurerKey: string, displayName?: string) => {
    const colIndex = dynamicInsurerColumns[insurerKey];
    const result: Record<string, any> = { insurer: displayName || insurerKey };
    
    if (colIndex === undefined) {
      // Insurer column not found in sheet, return nulls
      Object.keys(breakdownLabels).forEach(fieldKey => {
        result[fieldKey] = null;
      });
      return result;
    }
    
    Object.entries(breakdownLabels).forEach(([fieldKey, labelString]) => {
      const cleanLabel = labelString.trim().toLowerCase();
      const rowIndex = rowCache[cleanLabel];
      
      if (rowIndex !== undefined && values[rowIndex] && values[rowIndex].length > colIndex) {
        result[fieldKey] = values[rowIndex][colIndex];
      } else {
        result[fieldKey] = null;
      }
    });
    
    return result;
  };

  if (insurer) {
    const matchedHeaderName = headerRow.find((val: any) => val && typeof val === "string" && matchesInsurer(val, insurer));
    const key = matchedHeaderName ? matchInsurerKey(matchedHeaderName) : (Object.keys(dynamicInsurerColumns).find(k => k.toLowerCase() === insurer.toLowerCase()) || insurer);
    const displayName = matchedHeaderName || indexToHeaderName[key] || key;
    return extractBreakdown(key, displayName);
  }

  const allBreakdowns: Record<string, any> = {};
  activeInsurerKeys.forEach(key => {
    allBreakdowns[key] = extractBreakdown(key, indexToHeaderName[key]);
  });

  return allBreakdowns;

}

/**
 * Generates a populated Excel file by making a temporary copy in SharePoint,
 * mutating it via Graph API (so Excel handles serialization perfectly),
 * downloading the result, and cleaning up.
 */
export async function generatePopulatedExcelBuffer(payload: Record<string, any>, insurerId?: string): Promise<ArrayBuffer> {
  const client = await getGraphClient();
  
  const { driveId, itemId, parentId: cachedParentId } = await getWorkbookIds();
  
  // 1. Get original item metadata to find parent folder if not cached
  console.log("Getting item metadata...");
  let parentId = cachedParentId;
  if (!parentId) {
    const itemMeta = await client.api(`/drives/${driveId}/items/${itemId}`).get();
    parentId = itemMeta.parentReference.id;
  }

  // 2. Download original file
  console.log("Downloading original file...");
  const fileBuffer = await getRawFileBuffer();

  // 3. Upload as temp file using native fetch to bypass Next.js Graph SDK crash
  const tempName = `AIB_Temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.xlsx`;
  const token = await getGraphToken();
  const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentId}:/${tempName}:/content`;
  
  console.log("=== DIAGNOSTICS: Temp Upload ===");
  console.log("Upload URL:", uploadUrl);
  
  try {
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      },
      body: fileBuffer, // Send ArrayBuffer natively
      cache: "no-store"
    });

    console.log("Upload response status:", uploadRes.status);

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload temp file: ${uploadRes.status} ${uploadRes.statusText}`);
    }

    const tempItem = await uploadRes.json();
    var tempId = tempItem.id;
  } catch (error: any) {
    console.error("FULL ERROR IN temp file upload:");
    console.error(error);
    throw error;
  }

  try {
    // 4. Populate inputs directly on the temp file (no session needed)
    console.log("Populating inputs...");
    await populateInputs(null, payload, tempId);

    // 5. Hide unauthorized sheets if insurerId is provided
    if (insurerId) {
      console.log(`Hiding unauthorized sheets for insurer: ${insurerId}...`);
      
      const worksheetsResponse = await client.api(`/drives/${driveId}/items/${tempId}/workbook/worksheets`).get();
      const sheets = worksheetsResponse.value || [];

      const cleanInsurerName = insurerId.toLowerCase().replace(/[^a-z0-9]/g, "");
      const insurerWords = insurerId.split(/[\s_-]+/);
      const insurerAcronym = insurerWords.map(w => w.charAt(0)).join("").toLowerCase();
      
      const hidePromises = sheets.map(async (sheet: any) => {
        const sheetName = sheet.name;
        if (!sheetName.includes("_")) return;
        
        // Skip main shared worksheets
        if (["Quick Quote_Calculator", "Quick Quote Cal_Breakdown", "Reference Sheet"].includes(sheetName)) {
          return;
        }

        const prefix = sheetName.split("_")[0].toLowerCase();
        
        // Determine if this prefix belongs to the requested insurer
        let isMatch = false;
        if (prefix === cleanInsurerName || cleanInsurerName.includes(prefix)) {
          isMatch = true;
        } else if (prefix === insurerAcronym || insurerAcronym.includes(prefix)) {
          isMatch = true;
        } else {
          // Check prefix sequence in insurer words (e.g. gki -> GraceKennedy Insurance)
          const firstLetters = insurerWords.map(w => w.charAt(0).toLowerCase());
          let letterIdx = 0;
          for (const char of prefix) {
            const foundIdx = firstLetters.indexOf(char, letterIdx);
            if (foundIdx !== -1) {
              letterIdx = foundIdx + 1;
            } else {
              break;
            }
          }
          if (letterIdx > 0 && letterIdx === prefix.length) {
            isMatch = true;
          }
        }

        // Hide sheet if it is a different insurer's calculation sheet
        if (!isMatch) {
          await client.api(`/drives/${driveId}/items/${tempId}/workbook/worksheets('${sheetName}')`)
            .patch({ visibility: "Hidden" });
        }
      });
      await Promise.all(hidePromises);
    }

    // 6. Download the final file
    console.log("Downloading final file...");
    
    // Add a 5 second delay to ensure Excel Online has finished saving and released the file lock
    // This prevents the UND_ERR_CONNECT_TIMEOUT / hanging redirect issue when downloading
    console.log("Waiting 5 seconds for Excel lock to clear...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // To avoid redirect and locking issues, we get the pre-authenticated downloadUrl
    const tempItemMeta = await client.api(`/drives/${driveId}/items/${tempId}`).get();
    const downloadUrl = tempItemMeta["@microsoft.graph.downloadUrl"];
    
    console.log("=== DIAGNOSTICS: Final Download ===");
    console.log("Download URL:", downloadUrl);
    
    // Use native https to bypass Next.js buggy fetch polyfill
    const finalBuffer = await httpsGetBuffer(downloadUrl);

    return finalBuffer;

  } finally {
    // 7. Cleanup temp file ALWAYS
    console.log("Cleaning up temp file...");
    // Add a delay to ensure Excel Online has released the lock before deleting
    setTimeout(() => {
      client.api(`/drives/${driveId}/items/${tempId}`).delete()
        .then(() => console.log("Temp file deleted successfully."))
        .catch(e => console.error("Failed to delete temp file:", e.message));
    }, 5000);
  }
}
