const path = require('path');
// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");

// Mappings configuration matching config/excel-mapping.ts
const excelMapping = {
  sheetName: "Quick Quote_Calculator",
  inputs: {
    fullName: { cell: "D5", type: "string" },
    gender: { cell: "D6", type: "string" },
    dateOfBirth: { cell: "D7", type: "date" },
    trn: { cell: "D8", type: "string" },
    occupation: { cell: "D9", type: "string" },
    livingOrWorkingIn: { cell: "D10", type: "string" },
    employer: { cell: "D11", type: "string" },
    address: { cell: "D12", type: "string" },
    emailAddress: { cell: "D13", type: "string" },
    telephoneHome: { cell: "D14", type: "string" },
    telephoneWork: { cell: "D15", type: "string" },
    telephoneMobile: { cell: "D16", type: "string" },
    vehicleType: { cell: "D17", type: "string" },
    vehicleYear: { cell: "D18", type: "number" },
    isHighPerformanceVehicle: { cell: "D19", type: "string" },
    makeAndModel: { cell: "D20", type: "string" },
    valuationDoneWithin6Months: { cell: "D21", type: "string" },
    vehicleUse: { cell: "D22", type: "string" },
    vehicleAdded: { cell: "D23", type: "string" },
    motorcycleCC: { cell: "D24", type: "number" },
    typeOfBusiness: { cell: "D25", type: "string" },
    product: { cell: "D26", type: "string" },
    typeOfCover: { cell: "D27", type: "string" },
    vehicleValue: { cell: "D28", type: "number" }, // Maps to D28 (equivalent to sumInsured)
    renewalYear: { cell: "D29", type: "number" },
    tpAddOn: { cell: "D30", type: "string" },
    includeTheft: { cell: "D31", type: "string" },
    firstIssueDateOfDriversLicence: { cell: "D32", type: "date" },
    firstTimeInsured: { cell: "D33", type: "string" },
    previousInsurer: { cell: "D34", type: "string" },
    noClaimBonusDiscount: { cell: "D35", type: "string" },
    noClaimBonusDiscountYear: { cell: "D36", type: "number" },
    noClaimBonusPercentageEarned: { cell: "D37", type: "number" },
    accidentOrLossInLastFiveYears: { cell: "D38", type: "string" },
    paymentsMade: { cell: "D39", type: "number" },
    mainDriverGender: { cell: "D40", type: "string" },
    numberOfDrivers: { cell: "D41", type: "string" },
    manualLoadPercentage: { cell: "D42", type: "number" }
  }
};

// Form state payload matching production samples
const samplePayload = {
  fullName: "Alexander Vance",
  gender: "Male",
  dateOfBirth: "1997-11-10", // 10-Nov-1997
  trn: "123-456-789",
  occupation: "Engineer",
  livingOrWorkingIn: "Kingston & St. Andrew",
  employer: "AIB",
  address: "123 Main St",
  emailAddress: "alexander.v@curator.corp",
  telephoneHome: "+1 (876) 381-0000",
  telephoneWork: "+1 (876) 381-0000",
  telephoneMobile: "+1 (876) 381-0000",
  vehicleType: "Personal Vehicle",
  vehicleYear: 2024,
  isHighPerformanceVehicle: "No",
  makeAndModel: "Pequea 8012T",
  valuationDoneWithin6Months: "Yes",
  vehicleUse: "Private Use",
  vehicleAdded: "Under 3 months",
  motorcycleCC: 1600,
  typeOfBusiness: "New Business",
  product: "Private Car",
  typeOfCover: "Comprehensive",
  vehicleValue: 2000000,
  renewalYear: 1,
  tpAddOn: "Not Required",
  includeTheft: "Yes",
  firstIssueDateOfDriversLicence: "2018-05-15",
  firstTimeInsured: "Yes",
  previousInsurer: "None",
  noClaimBonusDiscount: "No",
  noClaimBonusDiscountYear: 0,
  noClaimBonusPercentageEarned: 0,
  accidentOrLossInLastFiveYears: "No",
  paymentsMade: 0,
  mainDriverGender: "Male",
  numberOfDrivers: "Insured only",
  manualLoadPercentage: 5
};

async function main() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const sharepointUrl = process.env.SHAREPOINT_URL;

  if (!tenantId || !clientId || !clientSecret) {
    console.error("Error: Azure credentials (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET) are not set in the environment.");
    process.exit(1);
  }

  console.log("Initializing Graph Client...");
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const graphScope = "https://graph.microsoft.com/.default";
  
  const client = Client.init({
    authProvider: async (done) => {
      try {
        const tokenResponse = await credential.getToken(graphScope);
        done(null, tokenResponse?.token || null);
      } catch (error) {
        done(error, null);
      }
    },
  });

  console.log("Resolving SharePoint Drive and Item IDs...");
  let driveId, itemId;
  
  if (sharepointUrl) {
    const encodedUrl = Buffer.from(sharepointUrl).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const token = `u!${encodedUrl}`;
    const driveItem = await client.api(`/shares/${token}/driveItem`).get();
    driveId = driveItem.parentReference.driveId;
    itemId = driveItem.id;
  } else {
    driveId = process.env.SHAREPOINT_DRIVE_ID;
    itemId = process.env.SHAREPOINT_ITEM_ID;
  }

  if (!driveId || !itemId) {
    console.error("Error: Could not resolve SharePoint Drive/Item ID.");
    process.exit(1);
  }

  const workbookPath = `/drives/${driveId}/items/${itemId}/workbook`;

  // 1. Create session (persistChanges: false)
  console.log("\n1. Creating isolated workbook session...");
  const sessionResponse = await client.api(`${workbookPath}/createSession`).post({ persistChanges: false });
  const sessionId = sessionResponse.id;
  console.log(`Session ID: ${sessionId}`);

  try {
    // 2. Format values exactly as lib/graph-excel.service.ts does
    console.log("\n2. Formatting input payload values...");
    const processedInputs = {};
    for (const [key, value] of Object.entries(samplePayload)) {
      const mapping = excelMapping.inputs[key];
      if (!mapping) continue;

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
      }
      processedInputs[key] = {
        cell: mapping.cell,
        originalValue: value,
        formattedValue: cellValue,
        type: mapping.type
      };
    }

    // 3. Write all values to the session
    console.log("\n3. Writing inputs to sheet cells...");
    for (const [key, details] of Object.entries(processedInputs)) {
      console.log(`Writing ${key} -> Cell ${details.cell} with value: "${details.formattedValue}"`);
      await client.api(`${workbookPath}/worksheets('${excelMapping.sheetName}')/range(address='${details.cell}')`)
        .header("workbook-session-id", sessionId)
        .patch({
          values: [[details.formattedValue]]
        });
    }

    // 4. Read back and print verification table
    console.log("\n4. Reading back and comparing cells...");
    console.log("--------------------------------------------------------------------------------------------------------------------------");
    console.log("Field".padEnd(25) | "Cell".padEnd(6) | "Sent Original".padEnd(20) | "Sent to API".padEnd(16) | "Excel Stored (Raw)".padEnd(20) | "Excel Display (Text)".padEnd(20) | "Status");
    console.log("--------------------------------------------------------------------------------------------------------------------------");

    const jsonOutput = {
      sent: {},
      readback: {}
    };

    for (const [key, details] of Object.entries(processedInputs)) {
      const response = await client.api(`${workbookPath}/worksheets('${excelMapping.sheetName}')/range(address='${details.cell}')`)
        .header("workbook-session-id", sessionId)
        .get();

      const storedRaw = response.values[0][0];
      const storedText = response.text[0][0];

      jsonOutput.sent[key] = details.formattedValue;
      jsonOutput.readback[key] = {
        cell: details.cell,
        raw: storedRaw,
        text: storedText
      };

      // Verification check
      let status = "DIFF";
      if (String(details.formattedValue) === String(storedRaw)) {
        status = "MATCH (RAW)";
      } else if (String(details.formattedValue) === String(storedText)) {
        status = "MATCH (TEXT)";
      } else {
        status = "TRANSFORMED";
      }

      console.log(
        `${key.padEnd(25)} | ` +
        `${details.cell.padEnd(4)} | ` +
        `${String(details.originalValue).slice(0, 18).padEnd(18)} | ` +
        `${String(details.formattedValue).slice(0, 14).padEnd(14)} | ` +
        `${String(storedRaw).slice(0, 18).padEnd(18)} | ` +
        `${String(storedText).slice(0, 18).padEnd(18)} | ` +
        `${status}`
      );
    }
    console.log("--------------------------------------------------------------------------------------------------------------------------");

    console.log("\n4.1. Combined JSON Output (Sent & Readback):");
    console.log(JSON.stringify(jsonOutput, null, 2));


  } catch (error) {
    console.error("An error occurred during verification:", error);
  } finally {
    // 5. Close session
    console.log("\n5. Closing isolated session...");
    await client.api(`${workbookPath}/closeSession`)
      .header("workbook-session-id", sessionId)
      .post({});
    console.log("Session closed.");
  }
}

main().catch(console.error);
