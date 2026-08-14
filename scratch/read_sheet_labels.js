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
  if (!sheet) {
    console.log("Quick Quote_Calculator not found");
    return;
  }

  console.log("Row | Col C (Label) | Col D (Value)");
  console.log("-----------------------------------");
  for (let i = 17; i <= 45; i++) {
    const cVal = sheet.getCell(`C${i}`).value;
    const dVal = sheet.getCell(`D${i}`).value;
    console.log(`${i} | ${cVal} | ${dVal}`);
  }
}

main().catch(console.error);
