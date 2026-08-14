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
  console.log("Loading workbook:", filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.log("Worksheets found:");
  workbook.worksheets.forEach((sheet, idx) => {
    console.log(`[${idx}] "${sheet.name}"`);
  });
}

main().catch(console.error);
