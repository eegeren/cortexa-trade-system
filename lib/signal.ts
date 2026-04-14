import { ADX_THRESHOLD, VOLUME_THRESHOLD } from "./config";

export function generateSignal(data: any) {
  const reasons: string[] = [];

  const emaBullish = data.ema20 > data.ema50;
  const rsiBullish = data.rsi > 55;
  const macdBullish = data.macdValue > data.macdSignal;

  const emaBearish = data.ema20 < data.ema50;
  const rsiBearish = data.rsi < 45;
  const macdBearish = data.macdValue < data.macdSignal;

  const strongTrend = data.adx > ADX_THRESHOLD;
  const enoughVolume = data.volumeRatio > VOLUME_THRESHOLD;

  if (emaBullish) {
    reasons.push(
      `EMA bullish: ema20 (${data.ema20.toFixed(2)}) > ema50 (${data.ema50.toFixed(2)})`
    );
  } else if (emaBearish) {
    reasons.push(
      `EMA bearish: ema20 (${data.ema20.toFixed(2)}) < ema50 (${data.ema50.toFixed(2)})`
    );
  } else {
    reasons.push("EMA nötr");
  }

  if (rsiBullish) {
    reasons.push(`RSI bullish: ${data.rsi.toFixed(2)} > 55`);
  } else if (rsiBearish) {
    reasons.push(`RSI bearish: ${data.rsi.toFixed(2)} < 45`);
  } else {
    reasons.push(`RSI nötr: ${data.rsi.toFixed(2)}`);
  }

  if (macdBullish) {
    reasons.push(
      `MACD bullish: ${data.macdValue.toFixed(2)} > ${data.macdSignal.toFixed(2)}`
    );
  } else if (macdBearish) {
    reasons.push(
      `MACD bearish: ${data.macdValue.toFixed(2)} < ${data.macdSignal.toFixed(2)}`
    );
  } else {
    reasons.push("MACD nötr");
  }

  if (strongTrend) {
    reasons.push(`ADX güçlü: ${data.adx.toFixed(2)} > ${ADX_THRESHOLD}`);
  } else {
    reasons.push(
      `ADX zayıf: ${Number(data.adx ?? 0).toFixed(2)} <= ${ADX_THRESHOLD}`
    );
  }

  if (enoughVolume) {
    reasons.push(
      `Hacim yeterli: ${data.volumeRatio.toFixed(2)} > ${VOLUME_THRESHOLD.toFixed(2)}`
    );
  } else {
    reasons.push(
      `Hacim zayıf: ${Number(data.volumeRatio ?? 0).toFixed(2)} <= ${VOLUME_THRESHOLD.toFixed(2)}`
    );
  }

  const bullish =
    emaBullish &&
    rsiBullish &&
    macdBullish &&
    strongTrend &&
    enoughVolume;

  const bearish =
    emaBearish &&
    rsiBearish &&
    macdBearish &&
    strongTrend &&
    enoughVolume;

  if (bullish) {
    return { signal: "BUY", reasons };
  }

  if (bearish) {
    return { signal: "SELL", reasons };
  }

  return { signal: "NO TRADE", reasons };
}