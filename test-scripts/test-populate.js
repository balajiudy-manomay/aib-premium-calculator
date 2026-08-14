const ExcelJS = require('exceljs');
const path = require('path');

// Mock Excel Mapping Inputs configuration matching config/excel-mapping.ts
const inputsMapping = {
  fullName: "D5",
  gender: "D6",
  dateOfBirth: "D7",
  trn: "D8",
  occupation: "D9",
  livingOrWorkingIn: "D10",
  employer: "D11",
  address: "D12",
  emailAddress: "D13",
  telephoneHome: "D14",
  telephoneWork: "D15",
  telephoneMobile: "D16",
  vehicleType: "D17",
  vehicleYear: "D18",
  vehicleValue: "D19",
  isHighPerformanceVehicle: "D20",
  makeAndModel: "D21",
  valuationDoneWithin6Months: "D22",
  vehicleUse: "D23",
  vehicleAdded: "D24",
  motorcycleCC: "D25",
  typeOfBusiness: "D26",
  product: "D27",
  typeOfCover: "D28",
  sumInsured: "D29",
  renewalYear: "D30",
  tpAddOn: "D31",
  includeTheft: "D32",
  firstIssueDateOfDriversLicence: "D33",
  firstTimeInsured: "D34",
  previousInsurer: "D35",
  noClaimBonusDiscount: "D36",
  noClaimBonusDiscountYear: "D37",
  noClaimBonusPercentageEarned: "D38",
  accidentOrLossInLastFiveYears: "D39",
  paymentsMade: "D40",
  mainDriverGender: "D41",
  numberOfDrivers: "D42"
};

// Form state payload matching mapQuoteStateToExcelInputs mapping output
const mockPayload = {
  fullName: "Jane Doe",
  gender: "Female",
  dateOfBirth: "1990-05-15",
  trn: "987-654-321",
  occupation: "Doctor",
  livingOrWorkingIn: "St. James",
  employer: "General Hospital",
  address: "456 Hospital Road",
  emailAddress: "jane.doe@hospital.org",
  telephoneHome: "+1 (876) 555-0111",
  telephoneWork: "+1 (876) 555-0222",
  telephoneMobile: "+1 (876) 555-0333",
  vehicleType: "Private Car",
  vehicleYear: 2022,
  vehicleValue: 3500000,
  isHighPerformanceVehicle: "No",
  makeAndModel: "Honda CR-V",
  valuationDoneWithin6Months: "Yes",
  vehicleUse: "Private Use",
  vehicleAdded: "Under 3 months",
  motorcycleCC: 0,
  typeOfBusiness: "New Business",
  product: "Private Car",
  typeOfCover: "Comprehensive",
  sumInsured: 3500000,
  renewalYear: 1,
  tpAddOn: "Not Required",
  includeTheft: "Yes",
  firstIssueDateOfDriversLicence: "2015-08-20",
  firstTimeInsured: "No",
  previousInsurer: "ICWI",
  noClaimBonusDiscount: "Yes",
  noClaimBonusDiscountYear: 5,
  noClaimBonusPercentageEarned: 50,
  accidentOrLossInLastFiveYears: "No",
  paymentsMade: 0,
  mainDriverGender: "Female",
  numberOfDrivers: "Insured only"
};

async function verifyPopulation() {
  const filePath = path.join(
    __dirname,
    "..",
    "public",
    "excels",
    "AIB_DSPP_Premium Consolidated Calculator(Ren)_18Mar26_v1.xlsx"
  );
  
  console.log("Loading workbook...");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet("Quick Quote_Calculator");

  console.log("\nPopulating mock payload into spreadsheet cells...");
  // Simulate the server's populateInputs function:
  Object.entries(mockPayload).forEach(([key, value]) => {
    const cellRef = inputsMapping[key];
    if (!cellRef) return;
    const cell = sheet.getCell(cellRef);
    if (key === "dateOfBirth" || key === "firstIssueDateOfDriversLicence") {
      cell.value = new Date(value);
    } else {
      cell.value = value;
    }
  });

  console.log("\nVerifying cells in spreadsheet:");
  console.log("--------------------------------------------------------------------------------");
  console.log("Field Key".padEnd(32) | "Cell".padEnd(8) | "Expected Value".padEnd(25) | "Spreadsheet Value");
  console.log("--------------------------------------------------------------------------------");
  
  let successCount = 0;
  let totalCount = 0;

  Object.entries(inputsMapping).forEach(([key, cellRef]) => {
    const cell = sheet.getCell(cellRef);
    let val = cell.value;
    let expected = mockPayload[key];

    // Format dates for comparison
    if (val instanceof Date) {
      val = val.toISOString().split('T')[0];
    }

    const match = String(val) === String(expected);
    totalCount++;
    if (match) successCount++;

    console.log(
      `${key.padEnd(32)} | ${cellRef.padEnd(8)} | ${String(expected).padEnd(25)} | ${val} [${match ? "PASS" : "FAIL"}]`
    );
  });

  console.log("--------------------------------------------------------------------------------");
  console.log(`Verification Complete: ${successCount} / ${totalCount} inputs correctly mapped and verified [${successCount === totalCount ? "SUCCESS" : "FAILED"}].`);
}

verifyPopulation().catch(console.error);
