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
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const sheet = workbook.getWorksheet("Quick Quote_Calculator");
  
  // Log original values
  console.log("Original C60 (Best Price Insurer):", sheet.getCell("C60").value);
  console.log("Original D60 (Best Price Premium):", sheet.getCell("D60").value);
  console.log("Original D48 (GK Premium):", sheet.getCell("D48").value);
  
  // Let's modify some inputs (e.g. sum insured in D29 or vehicle value in D19)
  console.log("\nModifying Vehicle Value (D19) to 10,000,000 and Sum Insured (D29) to 10,000,000");
  sheet.getCell("D19").value = 10000000;
  sheet.getCell("D29").value = 10000000;
  
  // Read again
  console.log("\nAfter modification without saving (in memory):");
  console.log("C60 (Best Price Insurer) value/result:", getVal(sheet.getCell("C60")));
  console.log("D60 (Best Price Premium) value/result:", getVal(sheet.getCell("D60")));
  console.log("D48 (GK Premium) value/result:", getVal(sheet.getCell("D48")));
  
  // Write to a temporary file
  const tempPath = path.join(__dirname, "temp-calc.xlsx");
  await workbook.xlsx.writeFile(tempPath);
  console.log("\nSaved to temp-calc.xlsx");
  
  // Load temp file
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.readFile(tempPath);
  const sheet2 = wb2.getWorksheet("Quick Quote_Calculator");
  console.log("\nAfter reloading the saved file:");
  console.log("C60 (Best Price Insurer) value/result:", getVal(sheet2.getCell("C60")));
  console.log("D60 (Best Price Premium) value/result:", getVal(sheet2.getCell("D60")));
  console.log("D48 (GK Premium) value/result:", getVal(sheet2.getCell("D48")));
}

function getVal(cell) {
  const value = cell.value;
  if (value && typeof value === 'object') {
    return { formula: value.formula, result: value.result };
  }
  return value;
}

main().catch(console.error);
