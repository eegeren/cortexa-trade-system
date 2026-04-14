import fs from "fs/promises";
import path from "path";

type SignalLogItem = {
  symbol: string;
  interval: string;
  signal: string;
  reasons: string[];
  entryPrice: number;
  time: string;
  candleTime: number;
  indicators: {
    ema20?: number;
    ema50?: number;
    rsi?: number;
    macdValue?: number;
    macdSignal?: number;
    adx?: number;
    atr?: number;
    volumeRatio?: number;
  };
};

const filePath = path.join(process.cwd(), "signals.json");

export async function logSignal(item: SignalLogItem) {
  try {
    const file = await fs.readFile(filePath, "utf-8");
    const parsed: SignalLogItem[] = JSON.parse(file);

    const alreadyExists = parsed.some(
      (log) =>
        log.symbol === item.symbol &&
        log.interval === item.interval &&
        log.candleTime === item.candleTime
    );

    if (alreadyExists) {
      return;
    }

    const nextData = [item, ...parsed].slice(0, 500);

    await fs.writeFile(filePath, JSON.stringify(nextData, null, 2), "utf-8");
  } catch (error) {
    console.error("Signal log error:", error);
  }
}