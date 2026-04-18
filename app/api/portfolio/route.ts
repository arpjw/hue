import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:8000/portfolio", { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Backend ${res.status}` }, { status: res.status });
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
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}
