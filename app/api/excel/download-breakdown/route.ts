import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quoteId,
      insurerName,
      policyDetails,
      loadings,
      premiumAfterLoading,
      discounts,
      premiumAfterDiscounts,
      premiumAfterMinimumPremium,
      charges,
      finalPremium,
    } = body;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Premium Breakdown");

    sheet.views = [{ showGridLines: true }];

    // 1. Title block
    const titleCell = sheet.getCell("A1");
    titleCell.value = "ALLIED INSURANCE BROKERS LIMITED";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 30;

    const subtitleCell = sheet.getCell("A2");
    subtitleCell.value = `Granular Underwriter Premium Breakdown Report — ${insurerName}`;
    subtitleCell.font = { name: "Arial", size: 11, italic: true, color: { argb: "FFFFFFFF" } };
    subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(2).height = 20;

    sheet.mergeCells("A1:D1");
    sheet.mergeCells("A2:D2");

    for (let r = 1; r <= 2; r++) {
      for (let c = 1; c <= 4; c++) {
        sheet.getCell(r, c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E2EAA" } // Dark blue
        };
      }
    }

    // Metadata Row
    sheet.getCell("A4").value = "Quote ID:";
    sheet.getCell("A4").font = { bold: true };
    sheet.getCell("B4").value = quoteId || "N/A";
    sheet.getCell("C4").value = "Report Date:";
    sheet.getCell("C4").font = { bold: true };
    sheet.getCell("D4").value = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let currentRow = 6;

    // Helper to format currency values safely
    const setCurrencyCell = (cellRef: string, val: any, isHighlight = false) => {
      const cell = sheet.getCell(cellRef);
      if (val !== undefined && val !== null) {
        cell.value = Number(val);
        cell.numFmt = "$#,##0.00";
      } else {
        cell.value = "$0.00";
      }
      cell.alignment = { horizontal: "right" };
      if (isHighlight) {
        cell.font = { bold: true, color: { argb: "FF1E2EAA" } };
      } else {
        cell.font = { name: "Arial", size: 9 };
      }
    };

    // Helper to format percentage values safely
    const formatPercentValue = (val: any) => {
      if (val === undefined || val === null || val === "") return "0%";
      const cleanVal = typeof val === 'string' ? val.replace('%', '').trim() : val;
      const num = Number(cleanVal);
      if (isNaN(num) || num === 0) return "0%";
      const absNum = Math.abs(num);
      const pct = absNum < 1.0 ? absNum * 100 : absNum;
      const formatted = Number(pct.toFixed(4));
      return `${formatted}%`;
    };

    // Helper to draw headers
    const writeSectionHeader = (label: string, colorHex: string) => {
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const hCell = sheet.getCell(`A${currentRow}`);
      hCell.value = label;
      hCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      hCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colorHex },
      };
      currentRow++;
    };

    // Helper for key-value row with merging value cells
    const writeDetailsRow = (label: string, val: any, isRight = false) => {
      sheet.getCell(`A${currentRow}`).value = label;
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9 };
      
      const vCell = sheet.getCell(`B${currentRow}`);
      if (isRight) {
        vCell.alignment = { horizontal: "right" };
      } else {
        vCell.alignment = { horizontal: "left" };
      }
      vCell.value = val;
      sheet.mergeCells(`B${currentRow}:D${currentRow}`);
      currentRow++;
    };

    // Helper to draw total highlights
    const writeTotalRow = (label: string, value: any, bgHex = "FFF1F5F9", textHex = "FF0F172A") => {
      sheet.mergeCells(`A${currentRow}:C${currentRow}`);
      const lCell = sheet.getCell(`A${currentRow}`);
      lCell.value = label;
      lCell.font = { bold: true, size: 9, color: { argb: textHex } };
      
      const vCell = sheet.getCell(`D${currentRow}`);
      vCell.value = Number(value);
      vCell.numFmt = "$#,##0.00";
      vCell.font = { bold: true, size: 10, color: { argb: textHex } };
      vCell.alignment = { horizontal: "right" };

      for (let col = 1; col <= 4; col++) {
        sheet.getCell(currentRow, col).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgHex },
        };
      }
      currentRow++;
    };

    // 2. Policy Details Section
    writeSectionHeader("POLICY DETAILS", "FF1E3A8A"); // Dark Blue
    if (policyDetails) {
      writeDetailsRow("Product Type:", policyDetails["Product"]);
      writeDetailsRow("Coverage Option:", policyDetails["Coverage"]);
      
      sheet.getCell(`A${currentRow}`).value = "Sum Insured:";
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9 };
      setCurrencyCell(`B${currentRow}`, policyDetails["Sum Insured"]);
      sheet.mergeCells(`B${currentRow}:D${currentRow}`);
      currentRow++;

      if (policyDetails["Rate"] !== undefined && policyDetails["Rate"] !== null) {
        writeDetailsRow("Underwriter Rate:", `${policyDetails["Rate"]}%`);
      }
      if (policyDetails["Rate Band"] !== undefined && policyDetails["Rate Band"] !== null) {
        writeDetailsRow("Rate Band Option:", policyDetails["Rate Band"]);
      }
    }
    writeTotalRow("BASE UNDERWRITING PREMIUM:", policyDetails?.["Base Premium"]);
    currentRow++;

    // 3. Loadings Section
    writeSectionHeader("APPLIED LOADINGS", "FFE11D48"); // Rose Red
    if (Array.isArray(loadings) && loadings.length > 0) {
      loadings.forEach((ld) => {
        writeDetailsRow(ld.label, `+${formatPercentValue(ld.value)}`, true);
      });
    } else {
      writeDetailsRow("No Loadings Applied", "0%");
    }
    writeTotalRow("PREMIUM AFTER APPLIED LOADINGS:", premiumAfterLoading);
    currentRow++;

    // 4. Discounts Section
    writeSectionHeader("APPLIED DISCOUNTS", "FF16A34A"); // Green
    if (Array.isArray(discounts) && discounts.length > 0) {
      discounts.forEach((dc) => {
        writeDetailsRow(dc.label, `-${formatPercentValue(dc.value)}`, true);
      });
    } else {
      writeDetailsRow("No Discounts Applied", "0%");
    }
    writeTotalRow("PREMIUM AFTER COMPREHENSIVE DISCOUNTS:", premiumAfterDiscounts, "FFF0FDF4", "FF15803D");
    currentRow++;

    // 5. Minimum Premium Check Section
    writeSectionHeader("MINIMUM PREMIUM COMPLIANCE", "FF4B5563"); // Slate
    writeTotalRow("PREMIUM COMPLYING WITH MINIMUM REQUIREMENT:", premiumAfterMinimumPremium);
    currentRow++;

    // 6. Charges & Taxes Section
    writeSectionHeader("TAXES, CHARGES & ANCILLARY FEES", "FF0369A1"); // Light blue
    if (charges) {
      sheet.getCell(`A${currentRow}`).value = "Service Charge:";
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9 };
      setCurrencyCell(`B${currentRow}`, charges["Service Charge"]);
      sheet.mergeCells(`B${currentRow}:D${currentRow}`);
      currentRow++;

      if (charges["Stamp Duty"] !== undefined && charges["Stamp Duty"] !== null && Number(charges["Stamp Duty"]) !== 0) {
        sheet.getCell(`A${currentRow}`).value = "Stamp Duty Fee:";
        sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9 };
        setCurrencyCell(`B${currentRow}`, charges["Stamp Duty"]);
        sheet.mergeCells(`B${currentRow}:D${currentRow}`);
        currentRow++;
      }

      sheet.getCell(`A${currentRow}`).value = "General Consumption Tax (GCT):";
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9 };
      setCurrencyCell(`B${currentRow}`, charges["General Consumption Tax (GCT)"]);
      sheet.mergeCells(`B${currentRow}:D${currentRow}`);
      currentRow++;
    }
    writeTotalRow("TOTAL INSURED PREMIUM PAYABLE:", finalPremium, "FFF1F5F9", "FF1E2EAA");

    // Columns Widths
    sheet.getColumn(1).width = 45;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=AIB_Breakdown_${insurerName.replace(/\s+/g, "_")}_${quoteId}.xlsx`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// refresh
