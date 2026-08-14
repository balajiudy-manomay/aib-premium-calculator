import { NextRequest, NextResponse } from "next/server";
import { getVehicles } from "@/lib/graph-excel.service";

let cachedVehicles: string[] | null = null;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bypassCache = searchParams.get("bypassCache") === "true";

    if (cachedVehicles && !bypassCache) {
      return NextResponse.json({
        success: true,
        source: "cache",
        vehicles: cachedVehicles,
      });
    }

    const uniqueVehicles = await getVehicles();

    // Cache the result
    cachedVehicles = uniqueVehicles;

    return NextResponse.json({
      success: true,
      source: "graph-api",
      vehicles: uniqueVehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
