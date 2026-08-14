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

  const sheetsToInspect = ["Quick Quote_Calculator", "Input Form", "Output Summary"];
  
  sheetsToInspect.forEach(sheetName => {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      console.log(`Sheet "${sheetName}" not found.`);
      return;
    }
    console.log(`\n--- Inspecting Sheet: "${sheetName}" ---`);
    console.log("C5 label/value:", sheet.getCell("C5").value, "| D5 label/value:", sheet.getCell("D5").value);
    console.log("C6 label/value:", sheet.getCell("C6").value, "| D6 label/value:", sheet.getCell("D6").value);
    console.log("C17 label/value:", sheet.getCell("C17").value, "| D17 label/value:", sheet.getCell("D17").value);
    console.log("C26 label/value:", sheet.getCell("C26").value, "| D26 label/value:", sheet.getCell("D26").value);
    console.log("C48 label/value:", sheet.getCell("C48").value, "| D48 label/value:", sheet.getCell("D48").value);
    console.log("C60 label/value:", sheet.getCell("C60").value, "| D60 label/value:", sheet.getCell("D60").value);
  });
}

main().catch(console.error);
