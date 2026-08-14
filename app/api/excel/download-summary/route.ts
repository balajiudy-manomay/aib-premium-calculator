import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quoteId, customerDetails, vehicleDetails, offers } = body;

    // 1. Create a new workbook and sheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Quote Summary");

    // Enable grid lines
    sheet.views = [{ showGridLines: true }];

    // 2. Add Title Banner Block
    const titleCell = sheet.getCell("A1");
    titleCell.value = "ALLIED INSURANCE BROKERS LIMITED";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 30;

    const subtitleCell = sheet.getCell("A2");
    subtitleCell.value = "Motor Vehicle Insurance - Quick Quote Summary Report";
    subtitleCell.font = { name: "Arial", size: 11, italic: true, color: { argb: "FFFFFFFF" } };
    subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(2).height = 20;

    // Merge title rows across columns A to D
    sheet.mergeCells("A1:D1");
    sheet.mergeCells("A2:D2");

    // Apply corporate dark blue color to Title Block
    for (let r = 1; r <= 2; r++) {
      for (let c = 1; c <= 4; c++) {
        sheet.getCell(r, c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E2EAA" }
        };
      }
    }

    // Add metadata info
    sheet.getCell("A4").value = "Quote ID:";
    sheet.getCell("A4").font = { bold: true };
    sheet.getCell("B4").value = quoteId || "N/A";
    sheet.getCell("C4").value = "Report Date:";
    sheet.getCell("C4").font = { bold: true };
    sheet.getCell("D4").value = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    // 3. Populate Customer Profile Section
    let currentRow = 6;
    
    // Header Row
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const custHeader = sheet.getCell(`A${currentRow}`);
    custHeader.value = "CUSTOMER PROFILE DETAILS";
    custHeader.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    custHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF475569" } // Slate header
    };
    currentRow++;

    // Grid details
    if (customerDetails) {
      Object.entries(customerDetails).forEach(([label, value]) => {
        sheet.getCell(`A${currentRow}`).value = label;
        sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9 };
        sheet.getCell(`B${currentRow}`).value = value as any;
        sheet.getCell(`B${currentRow}`).alignment = { horizontal: "left" };
        sheet.mergeCells(`B${currentRow}:D${currentRow}`);
        currentRow++;
      });
    }

    currentRow++; // Empty spacer row

    // 4. Populate Vehicle Details Section
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const vehHeader = sheet.getCell(`A${currentRow}`);
    vehHeader.value = "MOTOR VEHICLE & COVERAGE INFORMATION";
    vehHeader.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    vehHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF475569" } // Slate header
    };
    currentRow++;

    if (vehicleDetails) {
      Object.entries(vehicleDetails).forEach(([label, value]) => {
        sheet.getCell(`A${currentRow}`).value = label;
        sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9 };
        sheet.getCell(`B${currentRow}`).value = value as any;
        sheet.getCell(`B${currentRow}`).alignment = { horizontal: "left" };
        sheet.mergeCells(`B${currentRow}:D${currentRow}`);
        currentRow++;
      });
    }

    currentRow++; // Spacer row

    // 5. Populate Quotes Table Section
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const quoteHeader = sheet.getCell(`A${currentRow}`);
    quoteHeader.value = "PARTNER PREMIUM QUOTES COMPARISON";
    quoteHeader.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    quoteHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" } // Dark indigo/slate header
    };
    currentRow++;

    // Table Column Headers
    sheet.getCell(`A${currentRow}`).value = "Insurer Partner";
    sheet.getCell(`B${currentRow}`).value = "Status";
    sheet.getCell(`C${currentRow}`).value = "Estimated Annual Premium";
    sheet.mergeCells(`C${currentRow}:D${currentRow}`);
    sheet.getRow(currentRow).font = { bold: true, size: 9 };
    sheet.getRow(currentRow).alignment = { horizontal: "center" };
    
    // Header borders & fill
    for (let col = 1; col <= 3; col++) {
      sheet.getCell(currentRow, col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" }
      };
      sheet.getCell(currentRow, col).border = {
        bottom: { style: "medium", color: { argb: "FF94A3B8" } }
      };
    }
    currentRow++;

    // Table Rows
    if (Array.isArray(offers)) {
      offers.forEach((offer) => {
        sheet.getCell(`A${currentRow}`).value = offer.name;
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = offer.status;
        sheet.getCell(`B${currentRow}`).alignment = { horizontal: "center" };
        
        const premiumCell = sheet.getCell(`C${currentRow}`);
        if (offer.premium && Number(offer.premium) > 0) {
          premiumCell.value = Number(offer.premium);
          premiumCell.numFmt = "$#,##0.00";
          premiumCell.font = { bold: true, color: { argb: "FF1E2EAA" } };
        } else {
          premiumCell.value = "Not Eligible";
          premiumCell.font = { italic: true, color: { argb: "FF94A3B8" } };
        }
        premiumCell.alignment = { horizontal: "right" };
        sheet.mergeCells(`C${currentRow}:D${currentRow}`);

        // Borders for table data cells
        for (let col = 1; col <= 3; col++) {
          sheet.getCell(currentRow, col).border = {
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } }
          };
        }
        currentRow++;
      });
    }

    // Set Column Widths dynamically
    sheet.getColumn(1).width = 40; // Insurer Name
    sheet.getColumn(2).width = 15; // Status
    sheet.getColumn(3).width = 15; // Premium
    sheet.getColumn(4).width = 15; // Spacer

    // 6. Write workbook to buffer and return
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=AIB_Quote_Summary_${quoteId}.xlsx`
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// refresh
