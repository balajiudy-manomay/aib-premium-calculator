const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
require("dotenv").config({ path: ".env.local" });

const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const sharepointUrl = process.env.SHAREPOINT_URL;

async function main() {
  if (!tenantId || !clientId || !clientSecret || !sharepointUrl) {
    console.error("Missing required env variables in .env.local");
    console.log("Check that AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and SHAREPOINT_URL are defined.");
    return;
  }

  console.log("Resolving SharePoint URL:", sharepointUrl);
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

  const encodedUrl = Buffer.from(sharepointUrl).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const token = `u!${encodedUrl}`;
  
  try {
    const driveItem = await client.api(`/shares/${token}/driveItem`).get();
    console.log("\nSuccessfully resolved workbook details!");
    console.log("-----------------------------------------");
    console.log("SHAREPOINT_DRIVE_ID=" + driveItem.parentReference.driveId);
    console.log("SHAREPOINT_ITEM_ID=" + driveItem.id);
    if (driveItem.parentReference.siteId) {
      console.log("SHAREPOINT_SITE_ID=" + driveItem.parentReference.siteId);
    } else {
      console.log("SHAREPOINT_SITE_ID=" + (driveItem.parentReference.driveId.split('!')[0]));
    }
  } catch (error) {
    console.error("\nFailed to resolve IDs:", error.message || error);
  }
}

main().catch(console.error);
