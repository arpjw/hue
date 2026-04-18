import { NextResponse } from "next/server";

const ZEROED_PORTFOLIO = {
  positions: [],
  stats: { aum: 0, dayPnl: 0, mtdPnl: 0, ytdPnl: 0, winRate: 0, totalTrades: 0, avgTradeSize: 0 },
  lastUpdated: null,
};

export async function GET() {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/portfolio`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(ZEROED_PORTFOLIO);
    }
    const raw = await res.json();
    return NextResponse.json({
      positions: (raw.positions as Record<string, unknown>[]).map((p) => ({
        market: p.market,
        side: p.side,
        size: p.size,
        avgEntry: p.avg_entry,
        markPrice: p.mark_price,
        unrealizedPnl: p.unrealized_pnl,
        realizedPnl: p.realized_pnl,
        totalPnl: p.total_pnl,
      })),
      stats: {
        totalAUM: raw.stats.total_aum,
        dayPnl: raw.stats.day_pnl,
        mtdPnl: raw.stats.mtd_pnl,
        ytdPnl: raw.stats.ytd_pnl,
        winRate: raw.stats.win_rate,
        totalTrades: raw.stats.total_trades,
        avgTradeSize: raw.stats.avg_trade_size,
      },
      lastUpdated: raw.last_updated,
    });
  } catch {
    return NextResponse.json(ZEROED_PORTFOLIO);
  }
}
