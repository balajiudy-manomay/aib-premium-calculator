import { NextRequest, NextResponse } from "next/server";
import { createSession, closeSession, populateInputs, readOutputs } from "@/lib/graph-excel.service";

export async function POST(req: NextRequest) {
  let sessionId: string | null = null;
  try {
    const payload = await req.json();
    
    // 1. Create a Graph API workbook session
    sessionId = await createSession();
    
    // 2. Populate inputs from payload
    await populateInputs(sessionId, payload);

    // 3. Read evaluated outputs from Excel cells
    const outputs = await readOutputs(sessionId);

    return NextResponse.json({
      success: true,
      message: "Inputs populated, values read using Graph API.",
      inputsApplied: payload,
      outputs,
    });
  } catch (error) {
    console.error("Graph API Excel Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  } finally {
    // 4. Always close the session to avoid locking the file
    if (sessionId) {
      try {
        await closeSession(sessionId);
      } catch (closeError) {
        console.error("Failed to close Graph API session:", closeError);
      }
    }
  }
}
