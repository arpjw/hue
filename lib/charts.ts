import { velaPrice } from "@/lib/vela";
import type { TradeFill } from "@/lib/positions";

interface Lot {
  price: number;
  qty: number;
}

const normalizeTs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);

export function computeDailyPnl(
  trades: TradeFill[]
): Array<{ date: string; pnl: number }> {
  if (!Array.isArray(trades)) return [];
  const fillsByMarket = new Map<string, TradeFill[]>();
  for (const fill of trades) {
    if (!fill || !fill.market_id) continue;
    const arr = fillsByMarket.get(fill.market_id) ?? [];
    arr.push(fill);
    fillsByMarket.set(fill.market_id, arr);
  }

  const legs: Array<{ pnl: number; ts: number }> = [];

  for (const [, fills] of Array.from(fillsByMarket)) {
    fills.sort((a: TradeFill, b: TradeFill) => normalizeTs(a.timestamp) - normalizeTs(b.timestamp));
    const longLots: Lot[] = [];
    const shortLots: Lot[] = [];

    for (const fill of fills) {
      const price = velaPrice(fill.price);
      let remaining = fill.size;
      const ts = normalizeTs(fill.timestamp);

      if (fill.side === "buy") {
        while (remaining > 0 && shortLots.length > 0) {
          const lot = shortLots[0];
          const matched = Math.min(remaining, lot.qty);
          legs.push({ pnl: (lot.price - price) * matched, ts });
          lot.qty -= matched;
          remaining -= matched;
          if (lot.qty === 0) shortLots.shift();
        }
        if (remaining > 0) longLots.push({ price, qty: remaining });
      } else {
        while (remaining > 0 && longLots.length > 0) {
          const lot = longLots[0];
          const matched = Math.min(remaining, lot.qty);
          legs.push({ pnl: (price - lot.price) * matched, ts });
          lot.qty -= matched;
          remaining -= matched;
          if (lot.qty === 0) longLots.shift();
        }
        if (remaining > 0) shortLots.push({ price, qty: remaining });
      }
    }
  }

  const byDay = new Map<string, number>();
  for (const { pnl, ts } of legs) {
    const date = new Date(ts).toISOString().split("T")[0];
    byDay.set(date, (byDay.get(date) ?? 0) + pnl);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl }));
}
