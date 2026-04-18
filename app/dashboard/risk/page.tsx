"use client";

import { useMemo } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { usePolling } from "@/lib/hooks";
import { pctStr, pnlStr } from "@/lib/data";
import { MARKET_META } from "@/lib/vela";
import type { TradeFill } from "@/lib/positions";
import DrawdownChart from "@/components/dashboard/charts/DrawdownChart";

interface RiskResponse {
  var95_1d: number;
  varPctOfAum: number;
  sharpe30d: number;
  maxDrawdown: number;
  realizedVol30d: number;
  correlationMatrix: Record<string, Record<string, number>>;
  concentration: Array<{ market: string; pct: number }>;
}

const PALETTE = ["#F5D0A8", "#B8D8B0", "#B4CCE8", "#A8DDD0", "#C8B8E4"];

function correlationBg(v: number): string {
  const butter: [number, number, number] = [240, 229, 160];
  const sage: [number, number, number] = [184, 216, 176];
  const rose: [number, number, number] = [242, 184, 188];
  const from = butter;
  const to = v >= 0 ? sage : rose;
  const t = Math.abs(v);
  const r = Math.round(from[0] + t * (to[0] - from[0]));
  const g = Math.round(from[1] + t * (to[1] - from[1]));
  const b = Math.round(from[2] + t * (to[2] - from[2]));
  return `rgb(${r},${g},${b})`;
}

export default function RiskPage() {
  const { data: risk, countdown, refresh } = usePolling<RiskResponse>("/api/risk", 60_000);
  const { data: rawTrades } = usePolling<TradeFill[] | { trades: TradeFill[] }>(
    "/api/vela/trades",
    60_000
  );

  const trades = useMemo<TradeFill[]>(() => {
    if (!rawTrades) return [];
    if (Array.isArray(rawTrades)) return rawTrades;
    return (rawTrades as { trades: TradeFill[] }).trades ?? [];
  }, [rawTrades]);

  const matrixMarkets = risk ? Object.keys(risk.correlationMatrix) : [];
  const top5 = (risk?.concentration ?? []).slice(0, 5);
  const concTotal = top5.reduce((s, c) => s + c.pct, 0);

  const statCards = [
    {
      label: "VaR 95% 1d",
      value: risk ? pnlStr(risk.var95_1d) : null,
      sub: risk ? pctStr(risk.varPctOfAum) + " of AUM" : "",
      color: "#F2B8BC",
    },
    {
      label: "Sharpe 30d",
      value: risk ? risk.sharpe30d.toFixed(2) : null,
      sub: "annualized",
      color: "#C8B8E4",
    },
    {
      label: "Max Drawdown",
      value: risk ? pctStr(risk.maxDrawdown) : null,
      sub: "trailing 90d",
      color: "#F5D0A8",
    },
    {
      label: "Realized Vol 30d",
      value: risk ? pctStr(risk.realizedVol30d) : null,
      sub: "annualized",
      color: "#B8D8B0",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Risk" countdown={countdown} onRefresh={refresh} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl bg-white border border-hue-border overflow-hidden"
            >
              <div style={{ height: 3, background: card.color }} />
              <div className="p-4">
                <p className="text-xs text-hue-text/45 mb-1">{card.label}</p>
                {!risk ? (
                  <span className="inline-block w-24 h-6 bg-hue-surface rounded animate-pulse" />
                ) : (
                  <p className="font-mono text-xl font-semibold text-hue-text">
                    {card.value ?? "—"}
                  </p>
                )}
                <p className="text-xs text-hue-text/40 mt-1">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-hue-border flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hue-rose shrink-0" />
            <h2 className="font-serif text-base font-bold">Drawdown</h2>
          </div>
          <div className="p-5">
            <div className="h-56">
              <DrawdownChart trades={trades} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-hue-border">
            <h2 className="font-serif text-base font-bold">Correlation Matrix</h2>
          </div>
          <div className="p-5 overflow-x-auto">
            {matrixMarkets.length > 0 ? (
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="w-14" />
                    {matrixMarkets.map((m) => (
                      <th key={m} className="pb-2 px-0.5">
                        <span
                          className="block text-center"
                          style={{
                            fontFamily: "Courier New",
                            fontSize: 10,
                            color: "rgba(28,26,24,0.5)",
                            minWidth: 36,
                          }}
                        >
                          {MARKET_META[m]?.label ?? m.split("-")[0]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixMarkets.map((row) => (
                    <tr key={row}>
                      <td className="pr-3 py-0.5">
                        <span
                          style={{
                            fontFamily: "Courier New",
                            fontSize: 10,
                            color: "rgba(28,26,24,0.5)",
                          }}
                        >
                          {MARKET_META[row]?.label ?? row.split("-")[0]}
                        </span>
                      </td>
                      {matrixMarkets.map((col) => {
                        const val = risk?.correlationMatrix[row]?.[col] ?? 0;
                        return (
                          <td key={col} className="p-0.5">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center"
                              style={{ background: correlationBg(val) }}
                            >
                              <span
                                style={{
                                  fontFamily: "Courier New",
                                  fontSize: 9,
                                  color: "#1C1A18",
                                }}
                              >
                                {val.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <span className="inline-block w-full h-full bg-hue-surface rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-hue-border">
            <h2 className="font-serif text-base font-bold">Concentration</h2>
          </div>
          <div className="p-5">
            {top5.length > 0 ? (
              <div className="space-y-2">
                <div className="flex h-9 rounded-lg overflow-hidden">
                  {top5.map((c, i) => (
                    <div
                      key={c.market}
                      className="h-full flex items-center justify-center overflow-hidden"
                      style={{
                        width: `${(c.pct / concTotal) * 100}%`,
                        background: PALETTE[i],
                        minWidth: 28,
                      }}
                    >
                      <span
                        style={{ fontFamily: "Courier New", fontSize: 10, color: "#1C1A18" }}
                        className="truncate px-1"
                      >
                        {MARKET_META[c.market]?.label ?? c.market.split("-")[0]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  {top5.map((c, i) => (
                    <div key={c.market} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: PALETTE[i] }}
                      />
                      <span className="text-xs text-hue-text/60">
                        {MARKET_META[c.market]?.label ?? c.market.split("-")[0]}
                      </span>
                      <span
                        style={{ fontFamily: "Courier New", fontSize: 11 }}
                        className="text-hue-text"
                      >
                        {(c.pct * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-9 rounded-lg bg-hue-surface animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
