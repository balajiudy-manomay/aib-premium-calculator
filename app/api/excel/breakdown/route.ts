import { NextRequest, NextResponse } from "next/server";
import { createSession, closeSession, populateInputs, getBreakdowns } from "@/lib/graph-excel.service";

export async function POST(req: NextRequest) {
  let sessionId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const { inputs, insurer } = body;

    // 1. If inputs are provided, create a session and populate them
    if (inputs && typeof inputs === "object") {
      sessionId = await createSession();
      await populateInputs(sessionId, inputs);
    }

    // 2. Validate insurer if provided
    if (insurer) {
      const insurerKey = String(insurer).trim();
      const breakdown = await getBreakdowns(sessionId, insurerKey);
      
      if (breakdown.finalPremium === null && breakdown.basePremium === null) {
        return NextResponse.json(
          {
            success: false,
            error: `Insurer key "${insurerKey}" not found or inactive on the breakdown sheet.`,
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully read breakdown details for ${insurerKey}.`,
        breakdown,
      });
    }

    // 3. Read breakdowns for all insurers
    const allBreakdowns = await getBreakdowns(sessionId);

    return NextResponse.json({
      success: true,
      message: "Successfully read premium breakdown details for all insurers.",
      breakdowns: allBreakdowns,
    });
  } catch (error) {
    console.error("Error in breakdown API:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  } finally {
    if (sessionId) {
      try {
        await closeSession(sessionId);
      } catch (e) {
        console.error("Failed to close Graph API session:", e);
      }
    }
  }
}

// Allow simple GET requests to fetch the current breakdown in the Excel sheet
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const insurer = url.searchParams.get("insurer");

    if (insurer) {
      const insurerKey = insurer.trim();
      const breakdown = await getBreakdowns(null, insurerKey);
      if (breakdown.finalPremium === null && breakdown.basePremium === null) {
        return NextResponse.json(
          {
            success: false,
            error: `Insurer key "${insurerKey}" not found or inactive on the breakdown sheet.`,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, breakdown });
    }

    const allBreakdowns = await getBreakdowns(null);
    return NextResponse.json({ success: true, breakdowns: allBreakdowns });
  } catch (error) {
    console.error("Error fetching breakdown:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
