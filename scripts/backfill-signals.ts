import { getDb, insertSignalIfMissing, updateSignalOutcome } from "../lib/db";
import { calculateIndicators } from "../lib/indicators";
import { generateSignal } from "../lib/signal";

const db = getDb();

const targets = [
  { symbol: "ETHUSDT", interval: "15m" },
  { symbol: "ETHUSDT", interval: "1h" },
  { symbol: "SOLUSDT", interval: "4h" },
];

function getCandles(symbol: string, interval: string) {
  return db
    .prepare(`
      SELECT symbol, interval, open_time, close_time, open, high, low, close, volume
      FROM candles
      WHERE symbol = ? AND interval = ? AND is_closed = 1
      ORDER BY open_time ASC
    `)
    .all(symbol, interval) as any[];
}

function mapCandles(rows: any[]) {
  return rows.map((r) => ({
    openTime: Number(r.open_time),
    closeTime: Number(r.close_time),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
  }));
}

function evaluateOutcome(
  signalType: string,
  entryPrice: number,
  futureCandles: any[]
): { outcome: string; outcome_return_pct: number | null } {
  let outcome = "NEUTRAL";
  let outcomeReturnPct: number | null = null;

  for (const c of futureCandles) {
    const high = Number(c.high);
    const low = Number(c.low);

    if (signalType === "BUY") {
      if (high >= entryPrice * 1.02) {
        outcome = "WIN";
        outcomeReturnPct = 2;
        break;
      }
      if (low <= entryPrice * 0.99) {
        outcome = "LOSS";
        outcomeReturnPct = -1;
        break;
      }
    }

    if (signalType === "SELL") {
      if (low <= entryPrice * 0.98) {
        outcome = "WIN";
        outcomeReturnPct = 2;
        break;
      }
      if (high >= entryPrice * 1.01) {
        outcome = "LOSS";
        outcomeReturnPct = -1;
        break;
      }
    }
  }

  return {
    outcome,
    outcome_return_pct: outcomeReturnPct,
  };
}

function backfillFor(symbol: string, interval: string) {
  const rows = getCandles(symbol, interval);
  const candles = mapCandles(rows);

  if (candles.length < 100) {
    console.log(`[SKIP] ${symbol} ${interval} not enough candles`);
    return;
  }

  let inserted = 0;

  for (let i = 60; i < candles.length - 8; i++) {
    const history = candles.slice(0, i + 1);

    // mevcut calculateIndicators son mumu açık saydığı için son kapalı mumu korumak adına tekrar ekliyoruz
    const indicators = calculateIndicators([...history, history[history.length - 1]]);
    const signal = generateSignal(indicators);

    if (signal.signal !== "BUY" && signal.signal !== "SELL") {
      continue;
    }

    const signalCandle = history[history.length - 1];
    const entryPrice = signalCandle.close;
    const candleOpenTime = signalCandle.openTime;

    insertSignalIfMissing({
      symbol,
      interval,
      candle_open_time: candleOpenTime,
      signal: signal.signal,
      entry_price: entryPrice,
      reasons_json: JSON.stringify(signal.reasons),
      indicators_json: JSON.stringify({
        ema20: indicators.ema20,
        ema50: indicators.ema50,
        rsi: indicators.rsi,
        macdValue: indicators.macdValue,
        macdSignal: indicators.macdSignal,
        adx: indicators.adx,
        atr: indicators.atr,
        volumeRatio: indicators.volumeRatio,
      }),
    });

    const insertedSignal = db
      .prepare(`
        SELECT id
        FROM signals
        WHERE symbol = ? AND interval = ? AND candle_open_time = ?
      `)
      .get(symbol, interval, candleOpenTime) as any;

    const futureRows = rows.slice(i + 1, i + 1 + 8);

    const outcome = evaluateOutcome(signal.signal, entryPrice, futureRows);

    if (insertedSignal?.id) {
      updateSignalOutcome({
        id: Number(insertedSignal.id),
        outcome: outcome.outcome,
        outcome_return_pct: outcome.outcome_return_pct,
        outcome_checked_at: Date.now(),
      });
    }

    inserted++;
  }

  console.log(`[DONE] ${symbol} ${interval} inserted/checked: ${inserted}`);
}

function main() {
  for (const t of targets) {
    backfillFor(t.symbol, t.interval);
  }

  console.log("Backfill complete.");
}

main();