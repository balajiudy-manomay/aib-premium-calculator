const ExcelJS = require('exceljs');
async function test() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/excels/AIB_DSPP_Premium Consolidated Calculator(Ren)_18Mar26_v1.xlsx');
    console.log('Read successfully. Now writing...');
    
    workbook.worksheets.forEach(ws => {
      if (ws.conditionalFormattings && Array.isArray(ws.conditionalFormattings)) {
        ws.conditionalFormattings.forEach(cf => {
          if (cf.rules) cf.rules = [];
        });
      }
    });

    await workbook.xlsx.writeBuffer();
    console.log('Written successfully.');
  } catch (e) {
    console.error('CRASHED:', e);
  }
}
test();
