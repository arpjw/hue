import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:8000/risk", { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Backend ${res.status}` }, { status: res.status });
    }
    const raw = await res.json();
    return NextResponse.json({
      var95_1d: raw.var_95_1d,
      varPctOfAum: raw.var_pct_of_aum,
      sharpe30d: raw.sharpe_30d,
      maxDrawdown: raw.max_drawdown,
      realizedVol30d: raw.realized_vol_30d,
      correlationMatrix: raw.correlation_matrix,
      concentration: raw.concentration,
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}
