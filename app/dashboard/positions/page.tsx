"use client";

import { useState, useMemo } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { usePolling } from "@/lib/hooks";
import { computePositions, type TradeFill } from "@/lib/positions";
import {
  velaPrice,
  MARKET_META,
  MARKET_COLORS,
  type VelaMarket,
  type VelaTrade,
} from "@/lib/vela";

type Tab = "open" | "history";
type SideFilter = "BUY" | "SELL" | "both";

const PAGE_SIZE = 25;

function pnlColor(v: number): string {
  if (v > 0) return "text-hue-dsage";
  if (v < 0) return "text-hue-drose";
  return "text-hue-text/40";
}

function fmtPnl(v: number): string {
  const abs = Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (v >= 0 ? "+" : "-") + "$" + abs;
}

function fmtNum(v: number, dp = 2): string {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function fmtTime(ts: number): string {
  const d = new Date(ts < 1e12 ? ts * 1000 : ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${hh}:${mm}:${ss} · ${mon} ${day}`;
}

function SidePill({ side }: { side: string }) {
  const isBuy = side.toLowerCase() === "buy" || side === "LONG";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        isBuy ? "bg-hue-sage text-hue-dsage" : "bg-hue-rose text-hue-drose"
      }`}
    >
      {side.toUpperCase()}
    </span>
  );
}

function MarketCell({ market }: { market: string }) {
  const color = MARKET_COLORS[market] ?? "#B8D8B0";
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="font-medium">{market}</span>
    </div>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-hue-border">
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} className="px-5 py-3.5">
          <span className="inline-block h-4 bg-hue-surface rounded animate-pulse w-20" />
        </td>
      ))}
    </tr>
  );
}

function OpenPositionsTab({
  trades,
  markets,
  loading,
}: {
  trades: VelaTrade[];
  markets: VelaMarket[];
  loading: boolean;
}) {
  const positions = useMemo(
    () => computePositions(trades as TradeFill[], markets),
    [trades, markets]
  );

  const totals = useMemo(
    () => ({
      unrealized: positions.reduce((s, p) => s + p.unrealizedPnl, 0),
      realized: positions.reduce((s, p) => s + p.realizedPnl, 0),
      total: positions.reduce((s, p) => s + p.totalPnl, 0),
    }),
    [positions]
  );

  const headers = [
    "Market",
    "Side",
    "Size",
    "Avg Entry",
    "Mark",
    "Unrealized P&L",
    "Realized P&L",
    "Total P&L",
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hue-border">
            {headers.map((h) => (
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
          {loading ? (
            Array.from({ length: 4 }, (_, i) => <SkeletonRow key={i} cols={8} />)
          ) : positions.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-5 py-12 text-center text-hue-text/40 text-sm"
              >
                No open positions
              </td>
            </tr>
          ) : (
            positions.map((p) => {
              const meta = MARKET_META[p.market];
              const dp = meta?.decimals ?? 2;
              return (
                <tr
                  key={p.market}
                  className="border-b border-hue-border last:border-0 hover:bg-hue-surface/40"
                >
                  <td className="px-5 py-3.5">
                    <MarketCell market={p.market} />
                  </td>
                  <td className="px-5 py-3.5">
                    <SidePill side={p.side} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm">
                    {fmtNum(p.size, dp)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm">
                    ${fmtNum(p.avgEntry, dp)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm">
                    ${fmtNum(p.markPrice, dp)}
                  </td>
                  <td
                    className={`px-5 py-3.5 font-mono text-sm ${pnlColor(p.unrealizedPnl)}`}
                  >
                    {fmtPnl(p.unrealizedPnl)}
                  </td>
                  <td
                    className={`px-5 py-3.5 font-mono text-sm ${pnlColor(p.realizedPnl)}`}
                  >
                    {fmtPnl(p.realizedPnl)}
                  </td>
                  <td
                    className={`px-5 py-3.5 font-mono text-sm ${pnlColor(p.totalPnl)}`}
                  >
                    {fmtPnl(p.totalPnl)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {!loading && positions.length > 0 && (
          <tfoot>
            <tr className="border-t border-hue-border bg-hue-surface/30">
              <td
                colSpan={5}
                className="px-5 py-3 text-xs text-hue-text/40 font-medium"
              >
                Totals
              </td>
              <td
                className={`px-5 py-3 font-mono text-sm font-bold ${pnlColor(totals.unrealized)}`}
              >
                {fmtPnl(totals.unrealized)}
              </td>
              <td
                className={`px-5 py-3 font-mono text-sm font-bold ${pnlColor(totals.realized)}`}
              >
                {fmtPnl(totals.realized)}
              </td>
              <td
                className={`px-5 py-3 font-mono text-sm font-bold ${pnlColor(totals.total)}`}
              >
                {fmtPnl(totals.total)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function TradeHistoryTab({
  trades,
  loading,
}: {
  trades: VelaTrade[];
  loading: boolean;
}) {
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("both");
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () =>
      [...trades]
        .filter(Boolean)
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
    [trades]
  );

  const availableMarkets = useMemo(
    () =>
      Array.from(new Set(sorted.filter((t) => t.market_id).map((t) => t.market_id as string))).sort(),
    [sorted]
  );

  const filtered = useMemo(() => {
    return sorted.filter((t) => {
      if (!t || !t.market_id) return false;
      if (marketFilter !== "all" && t.market_id !== marketFilter) return false;
      if (sideFilter === "BUY" && t.side !== "buy") return false;
      if (sideFilter === "SELL" && t.side !== "sell") return false;
      return true;
    });
  }, [sorted, marketFilter, sideFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const headers = [
    "Time",
    "Market",
    "Side",
    "Price",
    "Quantity",
    "Notional Value",
    "Fill ID",
  ];

  return (
    <div>
      <div className="px-5 py-3 border-b border-hue-border flex items-center gap-3 flex-wrap">
        <select
          className="text-xs border border-hue-border rounded-full px-3 py-1.5 bg-white text-hue-text focus:outline-none cursor-pointer"
          value={marketFilter}
          onChange={(e) => {
            setMarketFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All Markets</option>
          {availableMarkets.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {(["both", "BUY", "SELL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSideFilter(s);
                setPage(0);
              }}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                sideFilter === s
                  ? "bg-hue-text text-white"
                  : "text-hue-text/50 hover:text-hue-text hover:bg-hue-surface"
              }`}
            >
              {s === "both" ? "Both" : s}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hue-border">
              {headers.map((h) => (
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
            {loading ? (
              Array.from({ length: 8 }, (_, i) => (
                <SkeletonRow key={i} cols={7} />
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-hue-text/40 text-sm"
                >
                  No trades found
                </td>
              </tr>
            ) : (
              pageRows.filter(Boolean).map((t) => {
                const meta = MARKET_META[t.market_id ?? ""];
                const dp = meta?.decimals ?? 2;
                const price = velaPrice(t.price ?? 0);
                const notional = price * (t.size ?? 0);
                return (
                  <tr
                    key={t.id ?? Math.random()}
                    className="border-b border-hue-border last:border-0 hover:bg-hue-surface/40"
                  >
                    <td className="px-5 py-3.5 font-mono text-sm text-hue-text/50">
                      {fmtTime(t.timestamp ?? 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <MarketCell market={t.market_id ?? ""} />
                    </td>
                    <td className="px-5 py-3.5">
                      <SidePill side={t.side ?? "buy"} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm">
                      ${fmtNum(price, dp)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm">
                      {fmtNum(t.size ?? 0, dp)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm">
                      ${fmtNum(notional, 2)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-hue-text/40 max-w-[140px] truncate">
                      {(t.id ?? "").length > 12 ? (t.id ?? "").slice(0, 12) + "…" : (t.id ?? "—")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && totalPages > 1 && (
        <div className="px-5 py-3 border-t border-hue-border flex items-center justify-between">
          <span className="text-xs text-hue-text/40">
            {filtered.length} trades · page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="text-xs px-3 py-1.5 rounded-full border border-hue-border font-medium disabled:opacity-30 hover:bg-hue-surface transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="text-xs px-3 py-1.5 rounded-full border border-hue-border font-medium disabled:opacity-30 hover:bg-hue-surface transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PositionsPage() {
  const [tab, setTab] = useState<Tab>("open");

  const {
    data: tradesData,
    loading: tradesLoading,
    countdown,
    lastUpdated,
    refresh,
  } = usePolling<VelaTrade[]>("/api/vela/trades", 60_000);

  const { data: marketsData, loading: marketsLoading } =
    usePolling<VelaMarket[]>("/api/vela/markets", 60_000);

  const trades = tradesData ?? [];
  const markets = marketsData ?? [];
  const loading = tradesLoading || marketsLoading;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Positions"
        countdown={countdown}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />
      <div className="px-6 pt-4 flex gap-2">
        {(["open", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
              tab === t
                ? "bg-hue-text text-white"
                : "text-hue-text/50 hover:text-hue-text hover:bg-hue-surface"
            }`}
          >
            {t === "open" ? "Open Positions" : "Trade History"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
          {tab === "open" ? (
            <OpenPositionsTab
              trades={trades}
              markets={markets}
              loading={loading}
            />
          ) : (
            <TradeHistoryTab trades={trades} loading={tradesLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
