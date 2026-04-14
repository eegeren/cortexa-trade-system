 import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "signals.json");
    const file = await fs.readFile(filePath, "utf-8");
    const signals = JSON.parse(file);

    return NextResponse.json(signals);
  } catch (error) {
    console.error("Read signals error:", error);
    return NextResponse.json([], { status: 200 });
  }
}