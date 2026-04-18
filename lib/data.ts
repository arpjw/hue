export const PORTFOLIO = {
  totalAUM: 4_280_000,
  dayPnl: 18_420,
  mtdPnl: 142_800,
  maxDrawdown: -0.0412,
  sharpe30d: 2.14,
  winRate: 0.638,
  totalTrades: 847,
  avgTradeSize: 28_400,
  ytdPnl: 512_000,
};

export const RISK = {
  var95_1d: 0.0278,
  realizedVol30d: 0.1842,
  btcConcentration: 0.42,
  ethConcentration: 0.31,
  solConcentration: 0.18,
  topConcentrations: [
    { asset: "BTC", pct: 0.42, color: "#F5D0A8" },
    { asset: "ETH", pct: 0.31, color: "#B8D8B0" },
    { asset: "SOL", pct: 0.18, color: "#B4CCE8" },
  ],
};

export interface Position {
  id: string;
  market: string;
  side: "BUY" | "SELL";
  size: number;
  entryPrice: number;
  color: string;
}

export const POSITIONS: Position[] = [
  {
    id: "1",
    market: "BTC-USDC",
    side: "BUY",
    size: 1.42,
    entryPrice: 61_240_000,
    color: "#F5D0A8",
  },
  {
    id: "2",
    market: "ETH-USDC",
    side: "BUY",
    size: 18.5,
    entryPrice: 3_180_000,
    color: "#B8D8B0",
  },
  {
    id: "3",
    market: "SOL-USDC",
    side: "SELL",
    size: 220,
    entryPrice: 142_000,
    color: "#B4CCE8",
  },
  {
    id: "4",
    market: "AVAX-USDC",
    side: "BUY",
    size: 85,
    entryPrice: 34_500,
    color: "#A8DDD0",
  },
];

export function pnlStr(value: number, prefix = "$"): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value >= 0 ? "+" : "-"}${prefix}${formatted}`;
}

export function pctStr(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}
