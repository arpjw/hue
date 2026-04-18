import { velaPrice, type VelaMarket } from "@/lib/vela";

export interface TradeFill {
  id?: string;
  market_id?: string;
  side?: "buy" | "sell";
  price?: number;
  size?: number;
  timestamp?: number;
}

export interface PositionSummary {
  market: string;
  side: "LONG" | "SHORT";
  size: number;
  avgEntry: number;
  markPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
}

export interface PortfolioStats {
  totalAUM: number;
  dayPnl: number;
  mtdPnl: number;
  ytdPnl: number;
  winRate: number;
  totalTrades: number;
  avgTradeSize: number;
}

interface Lot {
  price: number;
  qty: number;
}

interface ClosedLeg {
  realizedPnl: number;
  timestamp: number;
  size: number;
}

const normalizeTs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);

export function computePositions(trades: TradeFill[], markets: VelaMarket[]): PositionSummary[] {
  if (!Array.isArray(trades)) return [];
  const marketMap = new Map<string, VelaMarket>();
  for (const m of markets) marketMap.set(m.id, m);

  const fillsByMarket = new Map<string, TradeFill[]>();
  for (const fill of trades) {
    if (!fill || !fill.market_id) continue;
    const arr = fillsByMarket.get(fill.market_id) ?? [];
    arr.push(fill);
    fillsByMarket.set(fill.market_id, arr);
  }

  const results: PositionSummary[] = [];

  for (const [market, fills] of Array.from(fillsByMarket.entries())) {
    fills.sort((a: TradeFill, b: TradeFill) => a.timestamp - b.timestamp);

    const longLots: Lot[] = [];
    const shortLots: Lot[] = [];
    let realizedPnl = 0;

    for (const fill of fills) {
      const price = velaPrice(fill.price);
      let remaining = fill.size;

      if (fill.side === "buy") {
        while (remaining > 0 && shortLots.length > 0) {
          const lot = shortLots[0];
          const matched = Math.min(remaining, lot.qty);
          realizedPnl += (lot.price - price) * matched;
          lot.qty -= matched;
          remaining -= matched;
          if (lot.qty === 0) shortLots.shift();
        }
        if (remaining > 0) longLots.push({ price, qty: remaining });
      } else {
        while (remaining > 0 && longLots.length > 0) {
          const lot = longLots[0];
          const matched = Math.min(remaining, lot.qty);
          realizedPnl += (price - lot.price) * matched;
          lot.qty -= matched;
          remaining -= matched;
          if (lot.qty === 0) longLots.shift();
        }
        if (remaining > 0) shortLots.push({ price, qty: remaining });
      }
    }

    const hasLong = longLots.length > 0;
    const hasShort = shortLots.length > 0;
    if (!hasLong && !hasShort) continue;

    const activeLots = hasLong ? longLots : shortLots;
    const side: "LONG" | "SHORT" = hasLong ? "LONG" : "SHORT";
    const totalQty = activeLots.reduce((s, l) => s + l.qty, 0);
    const totalCost = activeLots.reduce((s, l) => s + l.price * l.qty, 0);
    const avgEntry = totalCost / totalQty;

    const velaMarket = marketMap.get(market);
    const markPrice = velaMarket
      ? (velaPrice(velaMarket.best_bid) + velaPrice(velaMarket.best_ask)) / 2
      : avgEntry;

    const unrealizedPnl =
      side === "LONG"
        ? (markPrice - avgEntry) * totalQty
        : (avgEntry - markPrice) * totalQty;

    results.push({
      market,
      side,
      size: totalQty,
      avgEntry,
      markPrice,
      unrealizedPnl,
      realizedPnl,
      totalPnl: realizedPnl + unrealizedPnl,
    });
  }

  return results;
}

export function computePortfolioStats(
  positions: PositionSummary[],
  trades: TradeFill[]
): PortfolioStats {
  if (!Array.isArray(trades)) {
    return { totalAUM: 0, dayPnl: 0, mtdPnl: 0, ytdPnl: 0, winRate: 0, totalTrades: 0, avgTradeSize: 0 };
  }
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const totalAUM = positions.reduce((s, p) => s + p.markPrice * p.size, 0);
  const totalUnrealized = positions.reduce((s, p) => s + p.unrealizedPnl, 0);

  const fillsByMarket = new Map<string, TradeFill[]>();
  for (const fill of trades) {
    if (!fill || !fill.market_id) continue;
    const arr = fillsByMarket.get(fill.market_id) ?? [];
    arr.push(fill);
    fillsByMarket.set(fill.market_id, arr);
  }

  const closedLegs: ClosedLeg[] = [];

  for (const [, fills] of Array.from(fillsByMarket.entries())) {
    fills.sort((a: TradeFill, b: TradeFill) => a.timestamp - b.timestamp);
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
          closedLegs.push({ realizedPnl: (lot.price - price) * matched, timestamp: ts, size: matched });
          lot.qty -= matched;
          remaining -= matched;
          if (lot.qty === 0) shortLots.shift();
        }
        if (remaining > 0) longLots.push({ price, qty: remaining });
      } else {
        while (remaining > 0 && longLots.length > 0) {
          const lot = longLots[0];
          const matched = Math.min(remaining, lot.qty);
          closedLegs.push({ realizedPnl: (price - lot.price) * matched, timestamp: ts, size: matched });
          lot.qty -= matched;
          remaining -= matched;
          if (lot.qty === 0) longLots.shift();
        }
        if (remaining > 0) shortLots.push({ price, qty: remaining });
      }
    }
  }

  const dayRealized = closedLegs
    .filter((l) => l.timestamp >= startOfDay)
    .reduce((s, l) => s + l.realizedPnl, 0);
  const mtdRealized = closedLegs
    .filter((l) => l.timestamp >= startOfMonth)
    .reduce((s, l) => s + l.realizedPnl, 0);
  const ytdRealized = closedLegs
    .filter((l) => l.timestamp >= startOfYear)
    .reduce((s, l) => s + l.realizedPnl, 0);

  const winning = closedLegs.filter((l) => l.realizedPnl > 0).length;
  const totalTrades = trades.length;
  const totalNotional = trades.reduce((s, t) => s + velaPrice(t.price) * t.size, 0);

  return {
    totalAUM,
    dayPnl: dayRealized + totalUnrealized,
    mtdPnl: mtdRealized + totalUnrealized,
    ytdPnl: ytdRealized + totalUnrealized,
    winRate: closedLegs.length > 0 ? winning / closedLegs.length : 0,
    totalTrades,
    avgTradeSize: totalTrades > 0 ? totalNotional / totalTrades : 0,
  };
}
