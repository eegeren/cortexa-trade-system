import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const candles = db
    .prepare(`
      SELECT symbol, interval, open_time, close_time, close, volume, is_closed
      FROM candles
      ORDER BY open_time DESC
      LIMIT 30
    `)
    .all();

  return NextResponse.json(candles);
}