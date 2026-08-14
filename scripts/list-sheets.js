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
  
  console.log("Found worksheets:");
  workbook.worksheets.forEach((sheet, index) => {
    console.log(`${String(index + 1).padStart(2, ' ')}. "${sheet.name}"`);
  });
}

main().catch(console.error);
