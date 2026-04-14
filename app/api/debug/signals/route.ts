import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const signals = db
    .prepare(`
      SELECT *
      FROM signals
      ORDER BY created_at DESC
      LIMIT 50
    `)
    .all();

  return NextResponse.json(signals);
}