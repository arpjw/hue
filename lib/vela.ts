export interface VelaMarket {
  id: string;
  best_bid: number;
  best_ask: number;
  spread: number;
}

export interface VelaTrade {
  id: string;
  market_id: string;
  side: "buy" | "sell";
  price: number;
  size: number;
  timestamp: number;
}

export interface VelaOrderBook {
  pair: string;
  bids: [number, number][];
  asks: [number, number][];
}

export function velaPrice(raw: number): number {
  return raw / 1_000_000;
}

export function fmtPrice(raw: number, dp = 2): string {
  return velaPrice(raw).toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function midPrice(market: VelaMarket): number {
  return (velaPrice(market.best_bid) + velaPrice(market.best_ask)) / 2;
}

export function spreadBps(market: VelaMarket): number {
  const mid = midPrice(market);
  if (mid === 0) return 0;
  return ((velaPrice(market.best_ask) - velaPrice(market.best_bid)) / mid) * 10_000;
}

export interface MarketMeta {
  color: string;
  deep: string;
  decimals: number;
  label: string;
}

export const MARKET_META: Record<string, MarketMeta> = {
  "BTC-USDC": { color: "hue-peach", deep: "hue-dpeach", decimals: 2, label: "BTC" },
  "ETH-USDC": { color: "hue-sage", deep: "hue-dsage", decimals: 2, label: "ETH" },
  "SOL-USDC": { color: "hue-sky", deep: "hue-dsky", decimals: 3, label: "SOL" },
  "AVAX-USDC": { color: "hue-mint", deep: "hue-dsage", decimals: 3, label: "AVAX" },
  "MATIC-USDC": { color: "hue-lav", deep: "hue-dlav", decimals: 4, label: "MATIC" },
  "LINK-USDC": { color: "hue-butter", deep: "hue-dpeach", decimals: 3, label: "LINK" },
  "UNI-USDC": { color: "hue-rose", deep: "hue-drose", decimals: 3, label: "UNI" },
  "ARB-USDC": { color: "hue-sky", deep: "hue-dsky", decimals: 4, label: "ARB" },
  "OP-USDC": { color: "hue-rose", deep: "hue-drose", decimals: 4, label: "OP" },
  "AAVE-USDC": { color: "hue-lav", deep: "hue-dlav", decimals: 2, label: "AAVE" },
  "DOGE-USDC": { color: "hue-butter", deep: "hue-dpeach", decimals: 5, label: "DOGE" },
};

export const ALL_MARKETS = Object.keys(MARKET_META);

export const MARKET_COLORS: Record<string, string> = {
  "BTC-USDC": "#F5D0A8",
  "ETH-USDC": "#B8D8B0",
  "SOL-USDC": "#B4CCE8",
  "AVAX-USDC": "#A8DDD0",
  "MATIC-USDC": "#C8B8E4",
  "LINK-USDC": "#F0E5A0",
  "UNI-USDC": "#F2B8BC",
  "ARB-USDC": "#B4CCE8",
  "OP-USDC": "#F2B8BC",
  "AAVE-USDC": "#C8B8E4",
  "DOGE-USDC": "#F0E5A0",
};
