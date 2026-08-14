const path = require('path');
// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");

// Configuration
const SHEET_NAME = "Quick Quote_Calculator";
const DEFAULT_CELL = "D7";
const DEFAULT_VALUE = "10/11/1997";

async function main() {
  const cellAddress = process.argv[2] || DEFAULT_CELL;
  const inputValue = process.argv[3] || DEFAULT_VALUE;

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
    console.error("Error: Could not resolve SharePoint Drive/Item ID. Please make sure SHAREPOINT_URL or SHAREPOINT_DRIVE_ID/SHAREPOINT_ITEM_ID is set.");
    process.exit(1);
  }

  console.log(`Drive ID: ${driveId}`);
  console.log(`Item ID: ${itemId}`);

  const workbookPath = `/drives/${driveId}/items/${itemId}/workbook`;

  // 1. Create a session to isolate changes (persistChanges: false)
  console.log("\n1. Creating isolated session...");
  const sessionResponse = await client.api(`${workbookPath}/createSession`).post({ persistChanges: false });
  const sessionId = sessionResponse.id;
  console.log(`Session ID: ${sessionId}`);

  try {
    // 2. Read the initial value
    console.log(`\n2. Reading initial state of cell ${cellAddress}...`);
    const initialRange = await client.api(`${workbookPath}/worksheets('${SHEET_NAME}')/range(address='${cellAddress}')`)
      .header("workbook-session-id", sessionId)
      .get();
    
    console.log("Initial Cell Info:");
    console.log(`  - Raw Value (value):`, initialRange.values[0][0]);
    console.log(`  - Formatted Text (text):`, initialRange.text[0][0]);
    console.log(`  - Value Type (valueTypes):`, initialRange.valueTypes[0][0]);

    // 3. Write input
    console.log(`\n3. Writing Value "${inputValue}" to cell ${cellAddress}...`);
    await client.api(`${workbookPath}/worksheets('${SHEET_NAME}')/range(address='${cellAddress}')`)
      .header("workbook-session-id", sessionId)
      .patch({
        values: [[inputValue]]
      });
    console.log("Write request completed.");

    // 4. Read same cell back immediately
    console.log(`\n4. Reading back cell ${cellAddress} immediately...`);
    const updatedRange = await client.api(`${workbookPath}/worksheets('${SHEET_NAME}')/range(address='${cellAddress}')`)
      .header("workbook-session-id", sessionId)
      .get();

    const storedValue = updatedRange.values[0][0];
    const storedText = updatedRange.text[0][0];
    const storedType = updatedRange.valueTypes[0][0];

    console.log("Readback Result:");
    console.log(`  - Raw Value (value):`, storedValue);
    console.log(`  - Formatted Text (text):`, storedText);
    console.log(`  - Value Type (valueTypes):`, storedType);

    // 5. Compare input vs stored values
    console.log(`\n5. Comparison & Verification:`);
    console.log(`  - Input:                  "${inputValue}"`);
    console.log(`  - Excel Stored (raw):     "${storedValue}"`);
    console.log(`  - Excel Formatted (text): "${storedText}"`);

    const isRawMatch = String(inputValue) === String(storedValue);
    const isTextMatch = String(inputValue) === String(storedText);

    if (isRawMatch) {
      console.log(`  => Excel stored the input EXACTLY as written in raw value.`);
    } else if (isTextMatch) {
      console.log(`  => Excel stored the input but formatted it; it matches the text representation.`);
    } else {
      console.log(`  => Excel parsed the input and transformed it (e.g. date conversion or serial number).`);
    }

  } catch (error) {
    console.error("An error occurred during verification:", error);
  } finally {
    // 6. Close the session
    console.log("\n6. Closing session...");
    await client.api(`${workbookPath}/closeSession`)
      .header("workbook-session-id", sessionId)
      .post({});
    console.log("Session closed successfully.");
  }
}

main().catch(console.error);
