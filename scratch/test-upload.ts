import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Log env variable presence to ensure they're loaded
console.log("TENANT ID present:", !!process.env.AZURE_TENANT_ID);

async function run() {
  try {
    const { generatePopulatedExcelBuffer } = await import("../lib/graph-excel.service");
    console.log("Starting generatePopulatedExcelBuffer...");
    const buffer = await generatePopulatedExcelBuffer({ "Customer Name": "TEST NAME" });
    console.log("Successfully generated buffer of size:", buffer.byteLength);
  } catch (error: any) {
    console.error("Caught Error:", error);
    if (error.stack) console.error(error.stack);
  }
}

run();
