"use client";

import { useState } from "react";
import TopBar from "@/components/dashboard/TopBar";
import OrderBookPanel from "@/components/dashboard/OrderBookPanel";
import { useVelaWs } from "@/hooks/useVelaWs";
import {
  velaPrice,
  midPrice,
  spreadBps,
  MARKET_META,
  ALL_MARKETS,
  MARKET_COLORS,
  type VelaMarket,
} from "@/lib/vela";

function SpreadPill({ bps }: { bps: number }) {
  if (bps < 10) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-hue-sage text-hue-dsage">
        {bps.toFixed(1)} bps
      </span>
    );
  }
  if (bps <= 50) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-hue-peach text-hue-dpeach">
        {bps.toFixed(1)} bps
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-hue-rose text-hue-drose">
      {bps.toFixed(1)} bps
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-hue-border">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-5 py-3.5">
          <span className="inline-block h-4 bg-hue-surface rounded animate-pulse w-20" />
        </td>
      ))}
    </tr>
  );
}

export default function MarketsPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  const { markets: wsMarkets, connectionStatus } = useVelaWs();

  const loading = Object.keys(wsMarkets).length === 0;
  const marketMap = new Map<string, VelaMarket>(Object.entries(wsMarkets));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Markets" connectionStatus={connectionStatus} />

      <div className="flex-1 overflow-hidden flex gap-0">
        <div className={`${selectedMarket ? "w-[60%]" : "w-full"} overflow-y-auto p-6 transition-all duration-200`}>
          <div className="rounded-xl bg-white border border-hue-border overflow-hidden">
            {(connectionStatus === "error" || connectionStatus === "disconnected") && loading && (
              <div className="px-5 py-3 border-b border-hue-border bg-hue-rose/10 text-hue-drose text-sm">
                Price feed unavailable — retrying...
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hue-border">
                    {["Market", "Best Bid", "Best Ask", "Mid Price", "Spread ($)", "Spread (bps)"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs text-hue-text/40 font-medium"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? ALL_MARKETS.map((id) => <SkeletonRow key={id} />)
                    : ALL_MARKETS.map((id) => {
                        const m = marketMap.get(id);
                        const meta = MARKET_META[id];
                        const dp = meta?.decimals ?? 2;
                        const color = MARKET_COLORS[id] ?? "#B8D8B0";
                        const isSelected = selectedMarket === id;

                        if (!m) {
                          return (
                            <tr
                              key={id}
                              className={`border-b border-hue-border last:border-0 cursor-pointer ${isSelected ? "bg-hue-surface" : "hover:bg-hue-surface/40"}`}
                              onClick={() => setSelectedMarket(isSelected ? null : id)}
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ background: color }}
                                  />
                                  <span className="font-medium">{id}</span>
                                </div>
                              </td>
                              {[1, 2, 3, 4, 5].map((i) => (
                                <td key={i} className="px-5 py-3.5 text-hue-text/30 font-mono text-sm">
                                  —
                                </td>
                              ))}
                            </tr>
                          );
                        }

                        const bid = velaPrice(m.best_bid);
                        const ask = velaPrice(m.best_ask);
                        const mid = midPrice(m);
                        const spreadDollar = ask - bid;
                        const bps = spreadBps(m);

                        const fmt = (n: number) =>
                          n.toLocaleString("en-US", {
                            minimumFractionDigits: dp,
                            maximumFractionDigits: dp,
                          });

                        return (
                          <tr
                            key={id}
                            className={`border-b border-hue-border last:border-0 cursor-pointer ${isSelected ? "bg-hue-surface" : "hover:bg-hue-surface/40"}`}
                            onClick={() => setSelectedMarket(isSelected ? null : id)}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ background: color }}
                                />
                                <span className="font-medium">{id}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-sm text-hue-dsage">
                              ${fmt(bid)}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-sm text-hue-drose">
                              ${fmt(ask)}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-sm">${fmt(mid)}</td>
                            <td className="px-5 py-3.5 font-mono text-sm">
                              ${spreadDollar.toLocaleString("en-US", {
                                minimumFractionDigits: dp,
                                maximumFractionDigits: dp,
                              })}
                            </td>
                            <td className="px-5 py-3.5">
                              <SpreadPill bps={bps} />
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedMarket && (
          <div className="w-[40%] border-l border-hue-border overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="rounded-none bg-white h-full">
                <OrderBookPanel pair={selectedMarket} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
