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
  
  const sheet = workbook.getWorksheet("Reference Sheet");
  if (!sheet) {
    console.error("Sheet 'Reference Sheet' not found!");
    process.exit(1);
  }
  
  const vehicles = [];
  const startRow = 3;
  const endRow = sheet.rowCount;
  
  for (let r = startRow; r <= endRow; r++) {
    const cellValue = sheet.getCell(`R${r}`).value;
    // Extract string value if cell is a formula result or complex cell object
    let val = cellValue;
    if (cellValue && typeof cellValue === 'object') {
      if (cellValue.result !== undefined) {
        val = cellValue.result;
      } else if (cellValue.richText) {
        val = cellValue.richText.map(t => t.text).join('');
      }
    }
    
    if (val !== null && val !== undefined) {
      const strVal = String(val).trim();
      if (strVal) {
        vehicles.push(strVal);
      }
    }
  }
  
  // Deduping the vehicle names
  const uniqueVehicles = [...new Set(vehicles)];
  
  console.log(JSON.stringify(uniqueVehicles, null, 2));
  console.error(`\n--- Summary Info ---`);
  console.error(`Total non-empty cells read: ${vehicles.length}`);
  console.error(`Total unique vehicles: ${uniqueVehicles.length}`);
}

main().catch(console.error);
