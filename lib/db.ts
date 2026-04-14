import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "cortexa.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS candles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  open_time INTEGER NOT NULL,
  close_time INTEGER NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL,
  is_closed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, interval, open_time)
);

CREATE INDEX IF NOT EXISTS idx_candles_symbol_interval_time
ON candles(symbol, interval, open_time);

CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  candle_open_time INTEGER NOT NULL,
  signal TEXT NOT NULL,
  entry_price REAL NOT NULL,
  reasons_json TEXT NOT NULL,
  indicators_json TEXT NOT NULL,
  outcome TEXT,
  outcome_return_pct REAL,
  outcome_checked_at INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, interval, candle_open_time)
);

CREATE INDEX IF NOT EXISTS idx_signals_symbol_interval_time
ON signals(symbol, interval, candle_open_time);
`);

export type CandleRow = {
  symbol: string;
  interval: string;
  open_time: number;
  close_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  is_closed?: number;
};

export function insertOrUpdateCandle(row: CandleRow) {
  const stmt = db.prepare(`
    INSERT INTO candles (
      symbol, interval, open_time, close_time, open, high, low, close, volume, is_closed
    ) VALUES (
      @symbol, @interval, @open_time, @close_time, @open, @high, @low, @close, @volume, @is_closed
    )
    ON CONFLICT(symbol, interval, open_time) DO UPDATE SET
      close_time=excluded.close_time,
      open=excluded.open,
      high=excluded.high,
      low=excluded.low,
      close=excluded.close,
      volume=excluded.volume,
      is_closed=excluded.is_closed
  `);

  stmt.run({
    ...row,
    is_closed: row.is_closed ?? 1,
  });
}

export function getRecentClosedCandles(symbol: string, interval: string, limit = 250) {
  const stmt = db.prepare(`
    SELECT symbol, interval, open_time, close_time, open, high, low, close, volume
    FROM candles
    WHERE symbol = ? AND interval = ? AND is_closed = 1
    ORDER BY open_time DESC
    LIMIT ?
  `);

  const rows = stmt.all(symbol, interval, limit) as any[];
  return rows.reverse();
}

export function insertSignalIfMissing(input: {
  symbol: string;
  interval: string;
  candle_open_time: number;
  signal: string;
  entry_price: number;
  reasons_json: string;
  indicators_json: string;
}) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO signals (
      symbol, interval, candle_open_time, signal, entry_price, reasons_json, indicators_json
    ) VALUES (
      @symbol, @interval, @candle_open_time, @signal, @entry_price, @reasons_json, @indicators_json
    )
  `);

  stmt.run(input);
}

export function getPendingSignals(limit = 100) {
  const stmt = db.prepare(`
    SELECT *
    FROM signals
    WHERE outcome IS NULL
    ORDER BY candle_open_time ASC
    LIMIT ?
  `);

  return stmt.all(limit) as any[];
}

export function getFutureCandles(
  symbol: string,
  interval: string,
  afterOpenTime: number,
  limit = 8
) {
  const stmt = db.prepare(`
    SELECT *
    FROM candles
    WHERE symbol = ? AND interval = ? AND is_closed = 1 AND open_time > ?
    ORDER BY open_time ASC
    LIMIT ?
  `);

  return stmt.all(symbol, interval, afterOpenTime, limit) as any[];
}

export function updateSignalOutcome(input: {
  id: number;
  outcome: string;
  outcome_return_pct: number | null;
  outcome_checked_at: number;
}) {
  const stmt = db.prepare(`
    UPDATE signals
    SET outcome = @outcome,
        outcome_return_pct = @outcome_return_pct,
        outcome_checked_at = @outcome_checked_at
    WHERE id = @id
  `);

  stmt.run(input);
}

export function getDb() {
  return db;
}