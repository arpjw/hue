import { NextResponse } from "next/server";
import type { VelaMarket } from "@/lib/vela";

const VELA_BASE = "https://vela-engine.fly.dev";

export async function GET() {
  try {
    const res = await fetch(`${VELA_BASE}/markets`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }
    const raw = (await res.json()) as Record<string, { best_bid: number; best_ask: number; spread: number }>;
    const markets: VelaMarket[] = Object.entries(raw).map(([id, data]) => ({
      id,
      best_bid: data.best_bid,
      best_ask: data.best_ask,
      spread: data.spread,
    }));
    return NextResponse.json(markets);
  } catch (e) {
    return NextResponse.json({ error: "Engine unreachable" }, { status: 503 });
  }
}
