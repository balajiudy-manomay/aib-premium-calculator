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

  const sheet = workbook.getWorksheet("Quick Quote_Calculator");
  console.log("Original C60:", sheet.getCell("C60").value);
  console.log("Original D60:", getVal(sheet.getCell("D60")));
  console.log("Original D48:", getVal(sheet.getCell("D48")));

  // Modify vehicle value in D19 and sum insured in D29
  console.log("\nModifying Vehicle Value (D19) to 10,000,000 and Sum Insured (D29) to 10,000,000");
  sheet.getCell("D19").value = 10000000;
  sheet.getCell("D29").value = 10000000;

  // Clear conditional formattings to prevent crash
  workbook.worksheets.forEach(s => {
    if (s.conditionalFormattings) s.conditionalFormattings = [];
    if (s._conditionalFormattings) s._conditionalFormattings = [];
  });

  const tempPath = path.join(__dirname, "temp-saved-recalc.xlsx");
  console.log("Saving workbook to:", tempPath);
  await workbook.xlsx.writeFile(tempPath);

  // Reload the saved file
  console.log("\nReloading saved file...");
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.readFile(tempPath);
  const sheet2 = wb2.getWorksheet("Quick Quote_Calculator");
  console.log("Reloaded C60:", sheet2.getCell("C60").value);
  console.log("Reloaded D60:", getVal(sheet2.getCell("D60")));
  console.log("Reloaded D48:", getVal(sheet2.getCell("D48")));
}

function getVal(cell) {
  const value = cell.value;
  if (value && typeof value === 'object') {
    return { formula: value.formula, result: value.result };
  }
  return value;
}

main().catch(console.error);
