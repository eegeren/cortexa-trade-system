"use client";

import { useEffect, useState } from "react";

type SignalData = {
  symbol?: string;
  interval?: string;
  entryPrice?: number;
  candleTime?: number;
  indicators?: {
    ema20?: number;
    ema50?: number;
    rsi?: number;
    macdValue?: number;
    macdSignal?: number;
  };
  signal?: {
    signal?: string;
    reasons?: string[];
  };
  error?: string;
};

type LoggedSignal = {
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
  };
};

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [data, setData] = useState<SignalData | null>(null);
  const [history, setHistory] = useState<LoggedSignal[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/signals", { cache: "no-store" });
      const json = await res.json();
      setHistory(Array.isArray(json) ? json : []);
    } catch {
      setHistory([]);
    }
  }

  async function fetchSignal() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/signal?symbol=${symbol}&interval=${interval}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      setData(json);
      await fetchHistory();
    } catch {
      setData({ error: "Signal fetch failed" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSignal();
  }, []);

  const signalText = data?.signal?.signal || "N/A";
  const reasons = data?.signal?.reasons || [];
  const indicators = data?.indicators || {};

  function signalColor(value: string) {
    if (value === "BUY") return "#22c55e";
    if (value === "SELL") return "#ef4444";
    return "#cbd5e1";
  }

  function signalBackground(value: string) {
    if (value === "BUY") {
      return "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.05))";
    }
    if (value === "SELL") {
      return "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.05))";
    }
    return "linear-gradient(135deg, rgba(148,163,184,0.14), rgba(148,163,184,0.04))";
  }

  function cardStyle() {
    return {
      background: "#111827",
      border: "1px solid #1f2937",
      borderRadius: "18px",
      padding: "16px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    } as const;
  }

  function statCard(label: string, value: string) {
    return (
      <div style={cardStyle()}>
        <div style={{ fontSize: "12px", opacity: 0.65, marginBottom: "8px" }}>
          {label}
        </div>
        <div style={{ fontSize: "24px", fontWeight: 700 }}>{value}</div>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #172033 0%, #0b1020 45%, #070b16 100%)",
        color: "white",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            marginBottom: "24px",
            padding: "24px",
            borderRadius: "24px",
            border: "1px solid #1e293b",
            background: "rgba(15, 23, 42, 0.82)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "#0f172a",
                  border: "1px solid #24324a",
                  fontSize: "12px",
                  opacity: 0.9,
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    background: loading ? "#f59e0b" : "#22c55e",
                    display: "inline-block",
                  }}
                />
                {loading ? "Updating..." : "Live Signal Engine"}
              </div>

              <h1 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1 }}>
                Cortexa Mini Dashboard
              </h1>
              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  opacity: 0.72,
                  maxWidth: "700px",
                  fontSize: "15px",
                }}
              >
                Canlı kripto verisiyle basit teknik sinyal üretimi, mevcut sinyal
                görünümü ve son kayıtların tek ekranda izlenmesi.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "end",
              }}
            >
              <div>
                <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.75 }}>
                  Coin
                </div>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  style={{
                    padding: "11px 14px",
                    borderRadius: "12px",
                    border: "1px solid #334155",
                    background: "#0f172a",
                    color: "white",
                    minWidth: "130px",
                  }}
                >
                  <option value="BTCUSDT">BTCUSDT</option>
                  <option value="ETHUSDT">ETHUSDT</option>
                  <option value="SOLUSDT">SOLUSDT</option>
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.75 }}>
                  Timeframe
                </div>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  style={{
                    padding: "11px 14px",
                    borderRadius: "12px",
                    border: "1px solid #334155",
                    background: "#0f172a",
                    color: "white",
                    minWidth: "100px",
                  }}
                >
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                </select>
              </div>

              <button
                onClick={fetchSignal}
                disabled={loading}
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: loading ? "#334155" : "#2563eb",
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  minHeight: "44px",
                }}
              >
                {loading ? "Loading..." : "Refresh Signal"}
              </button>
            </div>
          </div>
        </div>

        {data?.error ? (
          <div
            style={{
              background: "#3a1212",
              border: "1px solid #b33a3a",
              padding: "16px",
              borderRadius: "14px",
            }}
          >
            {data.error}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.25fr 1fr",
                gap: "18px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  borderRadius: "24px",
                  padding: "22px",
                  border: "1px solid #24324a",
                  background: signalBackground(signalText),
                  boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
                }}
              >
                <div style={{ fontSize: "13px", opacity: 0.75, marginBottom: "10px" }}>
                  Current Signal
                </div>

                <div
                  style={{
                    fontSize: "44px",
                    fontWeight: 800,
                    letterSpacing: "-1px",
                    color: signalColor(signalText),
                    marginBottom: "8px",
                  }}
                >
                  {signalText}
                </div>

                <div style={{ opacity: 0.78, marginBottom: "18px", fontSize: "15px" }}>
                  {symbol} · {interval}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "12px",
                  }}
                >
                  {statCard("Entry Price", Number(data?.entryPrice ?? 0).toFixed(2))}
                  {statCard("RSI", Number(indicators.rsi ?? 0).toFixed(2))}
                  {statCard("MACD", Number(indicators.macdValue ?? 0).toFixed(2))}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>
                  Signal Reasoning
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  {reasons.map((reason, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#0b1220",
                        border: "1px solid #1f2a3c",
                        borderRadius: "14px",
                        padding: "12px 14px",
                        fontSize: "14px",
                        lineHeight: 1.5,
                        opacity: 0.92,
                      }}
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {statCard("EMA20", Number(indicators.ema20 ?? 0).toFixed(2))}
              {statCard("EMA50", Number(indicators.ema50 ?? 0).toFixed(2))}
              {statCard("RSI", Number(indicators.rsi ?? 0).toFixed(2))}
              {statCard("MACD", Number(indicators.macdValue ?? 0).toFixed(2))}
              {statCard("MACD Signal", Number(indicators.macdSignal ?? 0).toFixed(2))}
            </div>

            <div style={cardStyle()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "20px" }}>Recent Signals</h3>
                  <p style={{ margin: "6px 0 0 0", opacity: 0.65, fontSize: "14px" }}>
                    Son oluşan kayıtlar
                  </p>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "#0b1220",
                    border: "1px solid #1f2a3c",
                    fontSize: "13px",
                    opacity: 0.8,
                  }}
                >
                  Total: {history.length}
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {history.length === 0 ? (
                  <div
                    style={{
                      background: "#0b1220",
                      padding: "16px",
                      borderRadius: "14px",
                      border: "1px solid #1f2a3c",
                      opacity: 0.8,
                    }}
                  >
                    Henüz kayıt yok.
                  </div>
                ) : (
                  history.map((item, index) => (
                    <div
                      key={`${item.symbol}-${item.interval}-${item.candleTime}-${index}`}
                      style={{
                        background: "#0b1220",
                        padding: "16px",
                        borderRadius: "16px",
                        border: "1px solid #1f2a3c",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                          marginBottom: "10px",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "15px" }}>
                          {item.symbol} · {item.interval}
                        </div>
                        <div
                          style={{
                            fontWeight: 800,
                            color: signalColor(item.signal),
                          }}
                        >
                          {item.signal}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          gap: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            background: "#0f172a",
                            border: "1px solid #1f2a3c",
                            borderRadius: "12px",
                            padding: "10px 12px",
                          }}
                        >
                          <div style={{ fontSize: "12px", opacity: 0.65 }}>Entry</div>
                          <div style={{ fontWeight: 700 }}>
                            {Number(item.entryPrice).toFixed(2)}
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#0f172a",
                            border: "1px solid #1f2a3c",
                            borderRadius: "12px",
                            padding: "10px 12px",
                          }}
                        >
                          <div style={{ fontSize: "12px", opacity: 0.65 }}>RSI</div>
                          <div style={{ fontWeight: 700 }}>
                            {Number(item.indicators?.rsi ?? 0).toFixed(2)}
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#0f172a",
                            border: "1px solid #1f2a3c",
                            borderRadius: "12px",
                            padding: "10px 12px",
                          }}
                        >
                          <div style={{ fontSize: "12px", opacity: 0.65 }}>Time</div>
                          <div style={{ fontWeight: 700, fontSize: "13px" }}>
                            {new Date(item.time).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <ul style={{ margin: 0, paddingLeft: "18px", opacity: 0.88 }}>
                        {item.reasons?.map((reason, i) => (
                          <li key={i} style={{ marginBottom: "5px", fontSize: "14px" }}>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}