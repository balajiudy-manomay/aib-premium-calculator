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

  const sheet = workbook.getWorksheet("Quick Quote Cal_Breakdown");
  if (!sheet) {
    console.log("Sheet not found.");
    return;
  }
  
  console.log("Quick Quote Cal_Breakdown Rows:");
  sheet.eachRow((row, rowNumber) => {
    const colB = row.getCell(2).value;
    if (colB !== null && colB !== undefined) {
      console.log(`Row ${rowNumber.toString().padStart(3, ' ')}: "${colB}"`);
    }
  });
}

main().catch(console.error);
