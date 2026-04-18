import { NextResponse } from "next/server";

const ZEROED_RISK = {
  var95_1d: 0,
  varPctOfAum: 0,
  sharpe30d: 0,
  maxDrawdown: 0,
  realizedVol30d: 0,
  correlationMatrix: {},
  concentration: [],
};

export async function GET() {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/risk`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(ZEROED_RISK);
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
    return NextResponse.json(ZEROED_RISK);
  }
}
