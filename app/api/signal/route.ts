import { NextRequest, NextResponse } from "next/server";
import { getBinanceKlines } from "@/lib/market";
import { calculateIndicators } from "@/lib/indicators";
import { generateSignal } from "@/lib/signal";
import { logSignal } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const symbol = searchParams.get("symbol") || "BTCUSDT";
    const interval = searchParams.get("interval") || "1h";

    const candles = await getBinanceKlines(symbol, interval, 200);
    const indicators = calculateIndicators(candles);
    const signal = generateSignal(indicators);

    const signalCandle = indicators.signalCandle;
    const entryPrice = signalCandle?.close ?? 0;
    const candleTime = signalCandle?.openTime ?? 0;

    await logSignal({
      symbol,
      interval,
      signal: signal.signal,
      reasons: signal.reasons,
      entryPrice,
      time: new Date().toISOString(),
      candleTime,
      indicators: {
        ema20: indicators.ema20,
        ema50: indicators.ema50,
        rsi: indicators.rsi,
        macdValue: indicators.macdValue,
        macdSignal: indicators.macdSignal,
        adx: indicators.adx,
        atr: indicators.atr,
        volumeRatio: indicators.volumeRatio,
      },
    });

    return NextResponse.json({
      symbol,
      interval,
      entryPrice,
      candleTime,
      indicators: {
        ema20: indicators.ema20,
        ema50: indicators.ema50,
        rsi: indicators.rsi,
        macdValue: indicators.macdValue,
        macdSignal: indicators.macdSignal,
        adx: indicators.adx,
        atr: indicators.atr,
        volumeRatio: indicators.volumeRatio,
      },
      signal,
    });
  } catch (e) {
    console.error("Signal API error:", e);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}