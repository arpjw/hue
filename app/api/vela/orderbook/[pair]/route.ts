import { NextResponse } from "next/server";

const VELA_BASE = "https://vela-engine.fly.dev";

export async function GET(
  _request: Request,
  { params }: { params: { pair: string } }
) {
  try {
    const res = await fetch(`${VELA_BASE}/orderbook/${params.pair}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Engine unreachable" }, { status: 503 });
  }
}
