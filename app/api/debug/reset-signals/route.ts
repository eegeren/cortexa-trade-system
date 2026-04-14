import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  db.prepare(`DELETE FROM signals`).run();

  return NextResponse.json({
    ok: true,
    message: "signals table cleared",
  });
}