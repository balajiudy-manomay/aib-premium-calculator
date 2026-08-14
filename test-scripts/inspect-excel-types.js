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

function inferType(numberFormat, val, originalMappingType) {
  if (!numberFormat) return originalMappingType || "string";
  const formatLower = numberFormat.toLowerCase();
  
  // Date formats check (contains y, m, d)
  if (formatLower.includes('y') || formatLower.includes('m') || formatLower.includes('d')) {
    // Avoid false positives like "General"
    if (!formatLower.includes('general')) {
      return "date";
    }
  }

  // Currency formats check (contains $, or specific currency symbols)
  if (formatLower.includes('$') || formatLower.includes('\"$\"')) {
    return "currency";
  }

  // Numbers (0, #, etc.)
  if (formatLower.includes('0') || formatLower.includes('#')) {
    return "number";
  }

  // Booleans
  if (typeof val === 'boolean') {
    return "boolean";
  }

  return "string";
}

async function main() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const sharepointUrl = process.env.SHAREPOINT_URL;

  if (!tenantId || !clientId || !clientSecret) {
    console.error("Error: Azure credentials are not set in the environment.");
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

  const workbookPath = `/drives/${driveId}/items/${itemId}/workbook`;

  console.log("\nReading cell types from Excel Sheet...");
  console.log("-------------------------------------------------------------------------------------------------------------");
  console.log("Field".padEnd(25) | "Cell".padEnd(6) | "Raw Value".padEnd(20) | "Display Value".padEnd(20) | "Number Format".padEnd(16) | "Inferred Type");
  console.log("-------------------------------------------------------------------------------------------------------------");

  const proposedSchema = {};

  for (const [key, mapping] of Object.entries(excelMapping.inputs)) {
    try {
      const response = await client.api(`${workbookPath}/worksheets('${excelMapping.sheetName}')/range(address='${mapping.cell}')`).get();
      
      const rawVal = response.values?.[0]?.[0];
      const textVal = response.text?.[0]?.[0];
      const numberFormat = response.numberFormat?.[0]?.[0];
      const formula = response.formulas?.[0]?.[0];
      
      const detectedType = inferType(numberFormat, rawVal, mapping.type);

      proposedSchema[key] = {
        cell: mapping.cell,
        type: detectedType,
        numberFormat: numberFormat,
        excelType: response.valueTypes?.[0]?.[0],
        formula: formula !== rawVal ? formula : undefined
      };

      console.log(
        `${key.padEnd(25)} | ` +
        `${mapping.cell.padEnd(4)} | ` +
        `${String(rawVal).slice(0, 18).padEnd(18)} | ` +
        `${String(textVal).slice(0, 18).padEnd(18)} | ` +
        `${String(numberFormat).slice(0, 14).padEnd(14)} | ` +
        `${detectedType}`
      );
    } catch (cellError) {
      console.error(`Error reading cell ${mapping.cell} for field ${key}:`, cellError.message);
    }
  }
  console.log("-------------------------------------------------------------------------------------------------------------");

  console.log("\nGenerated Metadata Schema:");
  console.log(JSON.stringify(proposedSchema, null, 2));
}

main().catch(console.error);
