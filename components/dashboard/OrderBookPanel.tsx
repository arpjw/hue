"use client";

import { usePolling } from "@/lib/hooks";
import {
  MARKET_META,
  MARKET_COLORS,
  velaPrice,
  type VelaOrderBook,
  type VelaTrade,
} from "@/lib/vela";

interface Props {
  pair: string | null;
}

function fmtQty(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(3) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(3) + "K";
  return n.toFixed(4);
}

function fmtTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("en-US", { hour12: false });
}

function SpreadPill({ bids, asks, dp }: { bids: [number, number][]; asks: [number, number][]; dp: number }) {
  if (!bids.length || !asks.length) return null;
  const bestBid = velaPrice(bids[0][0]);
  const bestAsk = velaPrice(asks[0][0]);
  const spread = bestAsk - bestBid;
  const mid = (bestBid + bestAsk) / 2;
  const bps = mid > 0 ? (spread / mid) * 10_000 : 0;

  return (
    <div className="flex justify-center py-2">
      <span className="px-3 py-1 rounded-full text-xs font-mono text-hue-text/50 bg-hue-surface border border-hue-border">
        Spread: ${spread.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })} ({bps.toFixed(1)} bps)
      </span>
    </div>
  );
}

function DepthRow({
  price,
  qty,
  maxQty,
  side,
  dp,
}: {
  price: number;
  qty: number;
  maxQty: number;
  side: "bid" | "ask";
  dp: number;
}) {
  const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
  const isBid = side === "bid";

  return (
    <div className="relative">
      <div
        className={`absolute top-0 bottom-0 ${isBid ? "bg-hue-sage/20 right-0" : "bg-hue-rose/20 left-0"}`}
        style={{ width: `${pct}%` }}
      />
      <div className="relative flex justify-between px-3 py-[3px]">
        <span
          className={`font-mono text-xs ${isBid ? "text-hue-dsage" : "text-hue-drose"}`}
          style={{ fontFamily: "Courier New, Courier, monospace" }}
        >
          ${velaPrice(price).toLocaleString("en-US", {
            minimumFractionDigits: dp,
            maximumFractionDigits: dp,
          })}
        </span>
        <span className="font-mono text-xs text-hue-text/50" style={{ fontFamily: "Courier New, Courier, monospace" }}>
          {fmtQty(qty)}
        </span>
      </div>
    </div>
  );
}

function OrderBookContent({ pair }: { pair: string }) {
  const meta = MARKET_META[pair];
  const color = MARKET_COLORS[pair] ?? "#B8D8B0";
  const dp = meta?.decimals ?? 2;

  const { data: ob, countdown } = usePolling<VelaOrderBook>(
    `/api/vela/orderbook/${encodeURIComponent(pair)}`,
    5_000
  );

  const { data: trades } = usePolling<VelaTrade[]>(
    `/api/vela/trades?market=${encodeURIComponent(pair)}`,
    5_000
  );

  const bids = ob?.bids?.slice(0, 15) ?? [];
  const asks = ob?.asks?.slice(0, 15) ?? [];
  const maxBidQty = bids.length ? Math.max(...bids.map(([, q]) => q)) : 0;
  const maxAskQty = asks.length ? Math.max(...asks.map(([, q]) => q)) : 0;

  const recentTrades = [...(trades ?? [])]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hue-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
          <span className="font-medium text-sm">{pair}</span>
          <span className="text-xs text-hue-text/40 ml-1">Order Book</span>
        </div>
        <span className="text-xs font-mono text-hue-text/40 bg-hue-surface px-2 py-0.5 rounded-full border border-hue-border">
          {countdown}s
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 min-h-0">
          <div className="border-r border-hue-border">
            <div className="px-3 py-1.5 border-b border-hue-border">
              <span className="text-xs font-medium text-hue-dsage">Bids</span>
            </div>
            {bids.map(([price, qty], i) => (
              <DepthRow key={i} price={price} qty={qty} maxQty={maxBidQty} side="bid" dp={dp} />
            ))}
            {bids.length === 0 && (
              <div className="px-3 py-2 text-xs text-hue-text/30 font-mono">—</div>
            )}
          </div>
          <div>
            <div className="px-3 py-1.5 border-b border-hue-border">
              <span className="text-xs font-medium text-hue-drose">Asks</span>
            </div>
            {asks.map(([price, qty], i) => (
              <DepthRow key={i} price={price} qty={qty} maxQty={maxAskQty} side="ask" dp={dp} />
            ))}
            {asks.length === 0 && (
              <div className="px-3 py-2 text-xs text-hue-text/30 font-mono">—</div>
            )}
          </div>
        </div>

        <SpreadPill bids={bids} asks={asks} dp={dp} />

        {recentTrades.length > 0 && (
          <div className="border-t border-hue-border">
            <div className="px-4 py-2 border-b border-hue-border">
              <span className="text-xs font-medium text-hue-text/50">Recent Trades</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-hue-border">
                  {["Time", "Side", "Price", "Qty"].map((h) => (
                    <th key={h} className="px-3 py-1.5 text-left font-medium text-hue-text/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((t) => (
                  <tr key={t.id} className="border-b border-hue-border last:border-0">
                    <td className="px-3 py-1.5 font-mono text-hue-text/50">{fmtTime(t.timestamp)}</td>
                    <td className={`px-3 py-1.5 font-medium ${t.side === "buy" ? "text-hue-dsage" : "text-hue-drose"}`}>
                      {t.side === "buy" ? "Buy" : "Sell"}
                    </td>
                    <td className={`px-3 py-1.5 font-mono ${t.side === "buy" ? "text-hue-dsage" : "text-hue-drose"}`}
                      style={{ fontFamily: "Courier New, Courier, monospace" }}>
                      ${velaPrice(t.price).toLocaleString("en-US", {
                        minimumFractionDigits: dp,
                        maximumFractionDigits: dp,
                      })}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-hue-text/60"
                      style={{ fontFamily: "Courier New, Courier, monospace" }}>
                      {fmtQty(t.size)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderBookPanel({ pair }: Props) {
  if (!pair) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-hue-text/40">Select a market to view depth</span>
      </div>
    );
  }
  return <OrderBookContent pair={pair} />;
}
