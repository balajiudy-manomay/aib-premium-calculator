const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");

async function main() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const sharepointUrl = process.env.SHAREPOINT_URL;

  if (!tenantId || !clientId || !clientSecret) {
    console.error("Missing Azure env vars");
    process.exit(1);
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const client = Client.init({
    authProvider: async (done) => {
      try {
        const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");
        done(null, tokenResponse?.token || null);
      } catch (error) {
        done(error, null);
      }
    },
  });

  const encodedUrl = Buffer.from(sharepointUrl).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const token = `u!${encodedUrl}`;
  const driveItem = await client.api(`/shares/${token}/driveItem`).get();
  const driveId = driveItem.parentReference.driveId;
  const itemId = driveItem.id;
  const workbookPath = `/drives/${driveId}/items/${itemId}/workbook`;

  console.log("Fetching usedRange of 'Quick Quote Cal_Breakdown'...");
  const res = await client.api(`${workbookPath}/worksheets('Quick Quote Cal_Breakdown')/usedRange`).get();
  
  const values = res.values || [];
  console.log(`Total rows: ${values.length}`);
  values.forEach((row, i) => {
    const label = row[1]; // Column B
    console.log(`Row ${i + 1}: B='${label}' | C='${row[2]}' | D='${row[3]}' | E='${row[4]}' | F='${row[5]}'`);
  });
}

main().catch(console.error);
