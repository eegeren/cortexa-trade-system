import WebSocket from "ws";
import {
  insertOrUpdateCandle,
  getRecentClosedCandles,
  insertSignalIfMissing,
  getPendingSignals,
  getFutureCandles,
  updateSignalOutcome,
} from "../lib/db";
import { calculateIndicators } from "../lib/indicators";
import { generateSignal } from "../lib/signal";
import { ALLOWED_SETUPS } from "../lib/config";

const symbols = ["btcusdt", "ethusdt", "solusdt"];
const intervals = ["15m", "1h", "4h"];

const streams = symbols.flatMap((symbol) =>
  intervals.map((interval) => `${symbol}@kline_${interval}`)
);

const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join("/")}`;

function isAllowed(symbol: string, interval: string) {
  return ALLOWED_SETUPS.some(
    (s) => s.symbol === symbol && s.interval === interval
  );
}

function mapDbCandles(rows: any[]) {
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

function evaluatePendingSignals() {
  const pending = getPendingSignals(200);

  for (const sig of pending) {
    const futureCandles = getFutureCandles(
      sig.symbol,
      sig.interval,
      Number(sig.candle_open_time),
      8
    );

    if (futureCandles.length < 8) continue;

    const entry = Number(sig.entry_price);
    let outcome = "NEUTRAL";
    let returnPct: number | null = null;

    for (const c of futureCandles) {
      const high = Number(c.high);
      const low = Number(c.low);

      if (sig.signal === "BUY") {
        if (high >= entry * 1.02) {
          outcome = "WIN";
          returnPct = 2;
          break;
        }
        if (low <= entry * 0.99) {
          outcome = "LOSS";
          returnPct = -1;
          break;
        }
      }

      if (sig.signal === "SELL") {
        if (low <= entry * 0.98) {
          outcome = "WIN";
          returnPct = 2;
          break;
        }
        if (high >= entry * 1.01) {
          outcome = "LOSS";
          returnPct = -1;
          break;
        }
      }
    }

    updateSignalOutcome({
      id: Number(sig.id),
      outcome,
      outcome_return_pct: returnPct,
      outcome_checked_at: Date.now(),
    });
  }
}

function handleClosedKline(payload: any) {
  const k = payload.k;

  const symbol = String(k.s).toUpperCase();
  const interval = String(k.i);

  if (!isAllowed(symbol, interval)) {
    return;
  }

  insertOrUpdateCandle({
    symbol,
    interval,
    open_time: Number(k.t),
    close_time: Number(k.T),
    open: Number(k.o),
    high: Number(k.h),
    low: Number(k.l),
    close: Number(k.c),
    volume: Number(k.v),
    is_closed: 1,
  });

  const rows = getRecentClosedCandles(symbol, interval, 250);
  const candles = mapDbCandles(rows);

  if (candles.length < 80) {
    return;
  }

  const indicators = calculateIndicators([...candles, candles[candles.length - 1]]);
  const signal = generateSignal(indicators);

  if (signal.signal === "BUY" || signal.signal === "SELL") {
    insertSignalIfMissing({
      symbol,
      interval,
      candle_open_time: Number(k.t),
      signal: signal.signal,
      entry_price: Number(k.c),
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

    console.log(
      `[SIGNAL] ${symbol} ${interval} ${signal.signal} @ ${Number(k.c).toFixed(2)}`
    );
  } else {
    console.log(`[NO TRADE] ${symbol} ${interval}`);
  }

  evaluatePendingSignals();
}

function start() {
  console.log("Connecting:", wsUrl);

  const ws = new WebSocket(wsUrl);

  ws.on("open", () => {
    console.log("Collector connected.");
  });

  ws.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString());
      const payload = parsed?.data ?? parsed;

      if (payload?.e !== "kline") return;
      if (!payload?.k?.x) return;

      handleClosedKline(payload);
    } catch (err) {
      console.error("Message parse error:", err);
    }
  });

  ws.on("close", () => {
    console.log("Collector disconnected. Reconnecting in 5s...");
    setTimeout(start, 5000);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    ws.close();
  });

  ws.on("ping", (data) => {
    ws.pong(data);
  });
}

start();