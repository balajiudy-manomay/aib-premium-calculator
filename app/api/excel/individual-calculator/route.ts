import { NextRequest, NextResponse } from "next/server";
import { generatePopulatedExcelBuffer } from "@/lib/graph-excel.service";

export async function POST(req: NextRequest) {
  try {
    const { payload, insurerId } = await req.json();

    if (!payload || !insurerId) {
      return NextResponse.json(
        { success: false, error: "Missing payload or insurerId" },
        { status: 400 }
      );
    }

    // Generate the populated buffer using Graph API to preserve complete fidelity
    const buffer = await generatePopulatedExcelBuffer(payload, insurerId);

    // 6. Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${insurerId}_cal.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating individual calculator:", error);
    return NextResponse.json(
      { success: false, error: error.stack || String(error) },
      { status: 500 }
    );
  }
}
