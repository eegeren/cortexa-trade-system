import { EMA, RSI, MACD, ADX, ATR, SMA } from "technicalindicators";
import type { Candle } from "./market";

export function calculateIndicators(candles: Candle[]) {
  // Son mum açık olabilir, bu yüzden onu kullanmıyoruz
  const closedCandles = candles.slice(0, -1);

  if (closedCandles.length < 60) {
    throw new Error("Not enough closed candle data");
  }

  const closes = closedCandles.map((c) => c.close);
  const highs = closedCandles.map((c) => c.high);
  const lows = closedCandles.map((c) => c.low);
  const volumes = closedCandles.map((c) => c.volume);

  const ema20Series = EMA.calculate({ period: 20, values: closes });
  const ema50Series = EMA.calculate({ period: 50, values: closes });
  const rsiSeries = RSI.calculate({ period: 14, values: closes });

  const macdSeries = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const adxSeries = ADX.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
  });

  const atrSeries = ATR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
  });

  const avgVolume20Series = SMA.calculate({
    period: 20,
    values: volumes,
  });

  const ema20 = ema20Series.at(-1);
  const ema50 = ema50Series.at(-1);
  const rsi = rsiSeries.at(-1);
  const macd = macdSeries.at(-1);
  const adx = adxSeries.at(-1);
  const atr = atrSeries.at(-1);

  const previousClosedVolume = volumes.at(-1);
  const avgVolume20 = avgVolume20Series.at(-1);

  const volumeRatio =
    previousClosedVolume && avgVolume20
      ? previousClosedVolume / avgVolume20
      : undefined;

  return {
    ema20,
    ema50,
    rsi,
    macdValue: macd?.MACD,
    macdSignal: macd?.signal,
    adx: adx?.adx,
    atr,
    volumeRatio,
    // kapanmış son mumun bilgisi
    signalCandle: closedCandles.at(-1),
  };
}