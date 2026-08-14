const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
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

  console.log("Clearing conditional formattings...");
  workbook.worksheets.forEach(sheet => {
    // Inspect sheet keys to find conditional formatting
    // ExcelJS usually stores them in sheet.conditionalFormattings or sheet._conditionalFormattings
    if (sheet.conditionalFormattings) {
      console.log(`Sheet "${sheet.name}" has ${sheet.conditionalFormattings.length || Object.keys(sheet.conditionalFormattings).length} conditional formattings`);
      sheet.conditionalFormattings = [];
    }
    // Also try internal properties just in case
    if (sheet._conditionalFormattings) {
      sheet._conditionalFormattings = [];
    }
  });

  const tempPath = path.join(__dirname, "temp-saved-cf.xlsx");
  console.log("Saving workbook to:", tempPath);
  await workbook.xlsx.writeFile(tempPath);
  console.log("Successfully saved without crashing!");
}

main().catch(console.error);
