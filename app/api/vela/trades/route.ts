import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

const VELA_BASE = "https://vela-engine.fly.dev";

export async function GET(request: NextRequest) {
  try {
    const market = request.nextUrl.searchParams.get("market");
    const url = market
      ? `${VELA_BASE}/trades/${encodeURIComponent(market)}`
      : `${VELA_BASE}/trades`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }
    const raw = await res.json();
    const trades = (Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>))
      .filter((t: unknown) => t !== null && t !== undefined);
    if (trades.length > 0) console.log("[vela/trades] sample trade shape:", JSON.stringify(trades[0]));
    return NextResponse.json(trades);
  } catch {
    return NextResponse.json({ error: "Engine unreachable" }, { status: 503 });
  }
}
