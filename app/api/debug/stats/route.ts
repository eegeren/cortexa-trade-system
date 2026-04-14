 import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const total = db.prepare(`SELECT COUNT(*) as count FROM signals`).get() as any;
  const wins = db.prepare(`SELECT COUNT(*) as count FROM signals WHERE outcome = 'WIN'`).get() as any;
  const losses = db.prepare(`SELECT COUNT(*) as count FROM signals WHERE outcome = 'LOSS'`).get() as any;
  const neutrals = db.prepare(`SELECT COUNT(*) as count FROM signals WHERE outcome = 'NEUTRAL'`).get() as any;

  const byPair = db.prepare(`
    SELECT symbol, interval, COUNT(*) as total,
           SUM(CASE WHEN outcome = 'WIN' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN outcome = 'LOSS' THEN 1 ELSE 0 END) as losses,
           SUM(CASE WHEN outcome = 'NEUTRAL' THEN 1 ELSE 0 END) as neutrals
    FROM signals
    GROUP BY symbol, interval
    ORDER BY total DESC
  `).all();

  const winRate =
    total.count > 0 ? Number(((wins.count / total.count) * 100).toFixed(2)) : 0;

  return NextResponse.json({
    totalSignals: total.count,
    wins: wins.count,
    losses: losses.count,
    neutrals: neutrals.count,
    overallWinRate: winRate,
    byPair,
  });
}