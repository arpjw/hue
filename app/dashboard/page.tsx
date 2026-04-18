"use client";

import { useMemo } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { usePolling } from "@/lib/hooks";
import { useVelaWs } from "@/hooks/useVelaWs";
import { useAccount } from "wagmi";
import { pnlStr, pctStr } from "@/lib/data";
import { midPrice, MARKET_META, MARKET_COLORS } from "@/lib/vela";
import type { PositionSummary, PortfolioStats, TradeFill } from "@/lib/positions";
import EquityCurve from "@/components/dashboard/charts/EquityCurve";
import DailyPnlBars from "@/components/dashboard/charts/DailyPnlBars";

interface PortfolioResponse {
  positions: PositionSummary[];
  stats: PortfolioStats;
  lastUpdated: string;
}

interface RiskResponse {
  var95_1d: number;
  varPctOfAum: number;
  sharpe30d: number;
  maxDrawdown: number;
  realizedVol30d: number;
  correlationMatrix: Record<string, Record<string, number>>;
  concentration: Array<{ market: string; pct: number }>;
}

export default function OverviewPage() {
  const { address } = useAccount();
  const { markets: wsMarkets, connectionStatus } = useVelaWs();
  const { data: portfolio, loading, error, countdown, refresh } = usePolling<PortfolioResponse>(
    "/api/portfolio",
    60_000
  );
  const { data: risk } = usePolling<RiskResponse>("/api/risk", 60_000);
  const { data: rawTrades } = usePolling<TradeFill[] | { trades: TradeFill[] }>(
    "/api/vela/trades",
    60_000
  );
  const trades = useMemo<TradeFill[]>(() => {
    if (!rawTrades) return [];
    if (Array.isArray(rawTrades)) return rawTrades;
    return (rawTrades as { trades: TradeFill[] }).trades ?? [];
  }, [rawTrades]);

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const positions = portfolio?.positions ?? [];
  const stats = portfolio?.stats;
  const totalAUM = stats?.totalAUM ?? 0;

  const concentrations = (risk?.concentration ?? []).slice(0, 3).map((c) => ({
    asset: c.market.split("-")[0],
    pct: c.pct,
    color: MARKET_COLORS[c.market] ?? "#F0E5A0",
  }));

  const statCards = [
    {
      label: "Total AUM",
      value: stats ? `$${(stats.totalAUM / 1_000_000).toFixed(2)}M` : null,
      color: "#F5D0A8",
      sub: "Vela + Cash",
    },
    {
      label: "Day P&L",
      value: stats ? pnlStr(stats.dayPnl) : null,
      color: "#B8D8B0",
      sub: stats && stats.totalAUM > 0 ? pctStr(stats.dayPnl / stats.totalAUM) : "",
    },
    {
      label: "MTD P&L",
      value: stats ? pnlStr(stats.mtdPnl) : null,
      color: "#A8DDD0",
      sub: stats && stats.totalAUM > 0 ? pctStr(stats.mtdPnl / stats.totalAUM) : "",
    },
    {
      label: "Max Drawdown",
      value: risk ? pctStr(risk.maxDrawdown) : null,
      color: "#F2B8BC",
      sub: "trailing 90d",
    },
    {
      label: "Sharpe 30d",
      value: risk ? risk.sharpe30d.toFixed(2) : null,
      color: "#C8B8E4",
      sub: "annualized",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Overview"
        countdown={countdown}
        onRefresh={refresh}
        connectionStatus={connectionStatus}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {truncatedAddress && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hue-dsage inline-block" />
            <span className="font-mono text-xs text-hue-text/50">{truncatedAddress}</span>
          </div>
        )}

        <div className="grid grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl bg-white border border-hue-border overflow-hidden"
            >
              <div style={{ height: 3, background: card.color }} />
              <div className="p-4">
                <p className="text-xs text-hue-text/45 mb-1">{card.label}</p>
                {loading && card.value === null ? (
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

        <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
          <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-hue-border">
              <h2 className="font-serif text-base font-bold">Positions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hue-border">
                    {["Market", "Side", "Size", "Entry", "Mark (Live)", "Unr. P&L"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs text-hue-text/40 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && positions.length === 0 ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-hue-border last:border-0">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <span className="inline-block w-16 h-4 bg-hue-surface rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    positions.map((pos) => {
                      const meta = MARKET_META[pos.market];
                      const color = MARKET_COLORS[pos.market] ?? "#F0E5A0";
                      const dp = meta?.decimals ?? 2;
                      const wsMarket = wsMarkets[pos.market];
                      const liveMarkPrice = wsMarket ? midPrice(wsMarket) : pos.markPrice;
                      const liveUnrealizedPnl = wsMarket
                        ? (liveMarkPrice - pos.avgEntry) * pos.size * (pos.side === "LONG" ? 1 : -1)
                        : pos.unrealizedPnl;
                      return (
                        <tr
                          key={pos.market}
                          className="border-b border-hue-border last:border-0 hover:bg-hue-surface/40"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: color }}
                              />
                              <span className="font-medium text-sm">{pos.market}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                pos.side === "LONG"
                                  ? "bg-hue-sage text-hue-dsage"
                                  : "bg-hue-rose text-hue-drose"
                              }`}
                            >
                              {pos.side}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-sm">
                            {pos.size.toLocaleString("en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: dp,
                            })}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-sm">
                            ${pos.avgEntry.toLocaleString("en-US", {
                              minimumFractionDigits: dp,
                              maximumFractionDigits: dp,
                            })}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-sm">
                            ${liveMarkPrice.toLocaleString("en-US", {
                              minimumFractionDigits: dp,
                              maximumFractionDigits: dp,
                            })}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-sm">
                            <span
                              className={
                                liveUnrealizedPnl >= 0 ? "text-hue-dsage" : "text-hue-drose"
                              }
                            >
                              {pnlStr(liveUnrealizedPnl)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-hue-border">
              <h2 className="font-serif text-base font-bold">Risk</h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-hue-text/50">VaR 95% 1d</span>
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-hue-drose">
                      {risk ? pctStr(risk.varPctOfAum) : "—"}
                    </span>
                    {risk && totalAUM > 0 && (
                      <span className="block text-xs text-hue-text/35">
                        ${(risk.var95_1d / 1000).toFixed(1)}k
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-hue-rose/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-hue-drose"
                    style={{ width: `${Math.min((risk?.varPctOfAum ?? 0) * 100 * 4, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-hue-text/50 mb-2">Top 3 Concentration</p>
                <div className="flex gap-1.5">
                  {concentrations.length > 0 ? (
                    concentrations.map((c) => (
                      <div
                        key={c.asset}
                        className="flex flex-col items-center justify-center rounded-lg py-2 flex-1 text-center"
                        style={{ background: c.color }}
                      >
                        <span className="font-mono text-xs font-bold text-hue-text">
                          {(c.pct * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-hue-text/60">{c.asset}</span>
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-lg py-2 bg-hue-surface animate-pulse"
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-hue-border">
                <span className="text-xs text-hue-text/50">Realized Vol 30d</span>
                <span className="font-mono text-sm font-semibold">
                  {risk ? pctStr(risk.realizedVol30d) : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-hue-text/50">YTD P&L</span>
                {loading && !stats ? (
                  <span className="inline-block w-20 h-4 bg-hue-surface rounded animate-pulse" />
                ) : (
                  <span className="font-mono text-sm font-semibold text-hue-dsage">
                    {stats ? pnlStr(stats.ytdPnl) : "—"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-hue-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-hue-sage shrink-0" />
              <h2 className="font-serif text-base font-bold">Equity Curve</h2>
            </div>
            <div className="p-5">
              <div className="h-48">
                <EquityCurve trades={trades} />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-hue-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-hue-peach shrink-0" />
              <h2 className="font-serif text-base font-bold">Daily P&L</h2>
            </div>
            <div className="p-5">
              <div className="h-48">
                <DailyPnlBars trades={trades} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Win Rate",
              value: stats ? pctStr(stats.winRate) : null,
              color: "#B8D8B0",
            },
            {
              label: "Total Trades",
              value: stats ? stats.totalTrades.toLocaleString() : null,
              color: "#B4CCE8",
            },
            {
              label: "Avg Trade Size",
              value: stats
                ? stats.avgTradeSize >= 1000
                  ? `$${(stats.avgTradeSize / 1000).toFixed(1)}k`
                  : `$${stats.avgTradeSize.toFixed(0)}`
                : null,
              color: "#C8B8E4",
            },
            {
              label: "Next Refresh",
              value: `${countdown}s`,
              color: "#F0E5A0",
              isCountdown: true,
              onClick: refresh,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border border-hue-border overflow-hidden ${
                card.isCountdown ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
              }`}
              style={{ background: card.color + "30" }}
              onClick={card.onClick}
            >
              <div style={{ height: 3, background: card.color }} />
              <div className="p-4">
                <p className="text-xs text-hue-text/45 mb-1">{card.label}</p>
                {loading && card.value === null ? (
                  <span className="inline-block w-16 h-6 bg-hue-surface/60 rounded animate-pulse" />
                ) : (
                  <p className="font-mono text-xl font-semibold text-hue-text">
                    {card.value ?? "—"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-hue-rose bg-hue-rose/10 px-5 py-3 text-sm text-hue-drose">
            Risk engine unreachable: {error}
          </div>
        )}
      </div>
    </div>
  );
}
