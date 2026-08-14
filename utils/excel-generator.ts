import ExcelJS from 'exceljs';

export async function generateSummaryExcelBlob(payload: any, logoUrl: string): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Quote Summary');

  // Set default column widths for A, B, C
  worksheet.columns = [
    { width: 45 }, // A: Labels / Insurer Partner
    { width: 35 }, // B: Values / Status
    { width: 35 }, // C: Premium / Dates
  ];

  try {
    // Add logo
    const imgBase64 = await convertWebpToPng(logoUrl);
    const imageId = workbook.addImage({
      base64: imgBase64,
      extension: 'png',
    });

    // Put logo at top left. Since it's floating, we just reserve empty rows.
    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 180, height: 75 },
    });
  } catch (error) {
    console.warn('Could not add logo to Excel:', error);
  }

  // Reserve rows 1-5 for the Logo
  for (let i = 0; i < 5; i++) worksheet.addRow([]);

  // Title Row (Row 6)
  const titleRow = worksheet.addRow(['Motor Vehicle Insurance - Quick Quote Summary Report']);
  worksheet.mergeCells(`A${titleRow.number}:C${titleRow.number}`);
  const titleCell = worksheet.getCell(`A${titleRow.number}`);
  titleCell.font = { size: 14, bold: true, color: { argb: 'FF2A275C' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  titleRow.height = 30;

  worksheet.addRow([]); // Row 7 empty

  // Quote Info (Row 8 & 9)
  const qRow1 = worksheet.addRow(['Quote ID:', payload.quoteId, '']);
  worksheet.mergeCells(`B${qRow1.number}:C${qRow1.number}`);
  const qRow2 = worksheet.addRow(['Report Date:', new Date().toLocaleDateString("en-US"), '']);
  worksheet.mergeCells(`B${qRow2.number}:C${qRow2.number}`);
  
  [qRow1, qRow2].forEach(r => {
    r.font = { bold: true, size: 11, color: { argb: 'FF334155' } };
    r.height = 20;
    ['A', 'B', 'C'].forEach(col => {
      worksheet.getCell(`${col}${r.number}`).alignment = { vertical: 'middle', horizontal: 'left' };
    });
  });

  worksheet.addRow([]); // Row 10 empty

  // Helper to add section headers
  const addSectionHeader = (title: string) => {
    const row = worksheet.addRow([title, '', '', '']);
    worksheet.mergeCells(`A${row.number}:D${row.number}`);
    row.height = 25;
    
    ['A', 'B', 'C', 'D'].forEach(col => {
      const cell = worksheet.getCell(`${col}${row.number}`);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A275C' } }; // brand-indigo
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF2A275C' } },
        bottom: { style: 'medium', color: { argb: 'FF2A275C' } },
        left: { style: 'medium', color: { argb: 'FF2A275C' } },
        right: { style: 'medium', color: { argb: 'FF2A275C' } }
      };
    });
    return row;
  };

  // Helper to add data rows
  const addDataRow = (key: string, value: any) => {
    const row = worksheet.addRow([key, value, '', '']);
    worksheet.mergeCells(`B${row.number}:D${row.number}`);
    row.height = 22;
    
    ['A', 'B', 'C', 'D'].forEach(col => {
      const cell = worksheet.getCell(`${col}${row.number}`);
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: col === 'A' ? 1 : 0 };
      cell.font = { size: 11, color: { argb: col === 'A' ? 'FF64748B' : 'FF0F172A' }, bold: col === 'B' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: col === 'A' ? { style: 'thin', color: { argb: 'FFE2E8F0' } } : undefined,
        right: col === 'D' ? { style: 'thin', color: { argb: 'FFE2E8F0' } } : undefined
      };
    });
  };

  // 1. BEST QUOTE HIGHLIGHT
  if (payload.bestOffer) {
    const bestRow = worksheet.addRow(['Estimated Annual Premium:', `${payload.bestOffer.name} - $${payload.bestOffer.premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, '', '']);
    worksheet.mergeCells(`B${bestRow.number}:D${bestRow.number}`);
    bestRow.height = 24;
    
    const labelCell = worksheet.getCell(`A${bestRow.number}`);
    labelCell.font = { bold: true, color: { argb: 'FF64748B' }, size: 10 }; // slate-500
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
    labelCell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    
    const valueCell = worksheet.getCell(`B${bestRow.number}`);
    valueCell.font = { bold: true, color: { argb: 'FF2A275C' }, size: 11 }; // brand-indigo
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
    valueCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    
    ['C', 'D'].forEach(col => {
      const c = worksheet.getCell(`${col}${bestRow.number}`);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    });
    
    worksheet.addRow([]);
  }

  // 2. CUSTOMER PROFILE DETAILS
  addSectionHeader('CUSTOMER PROFILE DETAILS');
  if (payload.customerDetails) {
    Object.entries(payload.customerDetails).forEach(([k, v]) => addDataRow(k, v));
  }
  worksheet.addRow([]);

  // 3. MOTOR VEHICLE & COVERAGE INFORMATION
  addSectionHeader('MOTOR VEHICLE & COVERAGE INFORMATION');
  if (payload.vehicleDetails) {
    Object.entries(payload.vehicleDetails).forEach(([k, v]) => addDataRow(k, v));
  }
  worksheet.addRow([]);

  // 4. RANKED PREMIUM COMPARISON CHART
  addSectionHeader('PREMIUM COMPARISON CHART');
  
  const offersHeader = worksheet.addRow(['Rank', 'Insurer', 'Premium', 'Difference']);
  offersHeader.height = 25;
  ['A', 'B', 'C', 'D'].forEach(col => {
    const cell = worksheet.getCell(`${col}${offersHeader.number}`);
    cell.font = { bold: true, color: { argb: 'FF475569' }, size: 11 }; // slate-600
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
    cell.alignment = { vertical: 'middle', horizontal: col === 'A' ? 'center' : (col === 'C' || col === 'D' ? 'right' : 'left'), indent: 1 };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFE2E8F0' } } }; // slate-200
  });

  if (Array.isArray(payload.offers)) {
    payload.offers.forEach((o: any) => {
      const premiumStr = `$${Number(o.premium).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      const isBest = o.rank === 1;
      
      const row = worksheet.addRow([o.rank, o.name, premiumStr, o.difference]);
      row.height = 24;
      
      ['A', 'B', 'C', 'D'].forEach(col => {
        const cell = worksheet.getCell(`${col}${row.number}`);
        cell.alignment = { vertical: 'middle', horizontal: col === 'A' ? 'center' : (col === 'C' || col === 'D' ? 'right' : 'left'), indent: 1 };
        
        let fontColor = 'FF1E293B'; // slate-800
        let isBold = true;
        
        if (col === 'C') {
          fontColor = 'FF2A275C'; // brand-indigo
        } else if (col === 'D') {
          fontColor = isBest ? 'FF059669' : 'FF64748B'; // emerald-600 (Best Price) or slate-500
        }
        
        cell.font = { size: 11, color: { argb: fontColor }, bold: isBold };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } } }; // slate-100
      });
    });
  }

  worksheet.addRow([]);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function convertWebpToPng(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl.split(',')[1]); 
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
