import { NextRequest, NextResponse } from "next/server";
import { generatePopulatedExcelBuffer } from "@/lib/graph-excel.service";

export async function POST(req: NextRequest) {
  try {
    const { payload } = await req.json();

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Missing payload data" },
        { status: 400 }
      );
    }

    // Generate the populated buffer using Graph API to preserve complete fidelity
    const buffer = await generatePopulatedExcelBuffer(payload);

    // 5. Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="AIB_Master_Calculator_Populated.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating Excel download:", error);
    return NextResponse.json(
      { success: false, error: error.stack || String(error) },
      { status: 500 }
    );
  }
}
