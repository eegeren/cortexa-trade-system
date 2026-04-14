import { insertOrUpdateCandle } from "../lib/db";

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const intervals = ["15m", "1h", "4h"];

async function fetchKlines(symbol: string, interval: string, limit = 200) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${symbol} ${interval}: ${res.status}`);
  }

  return res.json();
}

async function seed() {
  for (const symbol of symbols) {
    for (const interval of intervals) {
      console.log(`Seeding ${symbol} ${interval}...`);

      const klines = await fetchKlines(symbol, interval, 200);

      for (const k of klines) {
        insertOrUpdateCandle({
          symbol,
          interval,
          open_time: Number(k[0]),
          close_time: Number(k[6]),
          open: Number(k[1]),
          high: Number(k[2]),
          low: Number(k[3]),
          close: Number(k[4]),
          volume: Number(k[5]),
          is_closed: 1,
        });
      }
    }
  }

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed error:", err);
});