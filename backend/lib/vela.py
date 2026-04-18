import os
import random
import time
import httpx

VELA_BASE = "https://vela-engine.fly.dev"
PRICE_DIV = 1_000_000


async def get_markets() -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{VELA_BASE}/markets")
        r.raise_for_status()
        return r.json()


async def get_trades() -> list:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{VELA_BASE}/trades")
        r.raise_for_status()
        return r.json()


async def get_orderbook(pair: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{VELA_BASE}/orderbook/{pair}")
        r.raise_for_status()
        return r.json()


async def get_state() -> dict:
    token = os.getenv("VELA_ADMIN_TOKEN", "")
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{VELA_BASE}/state", headers={"X-Admin-Token": token})
        r.raise_for_status()
        return r.json()


def get_mock_trades() -> list[dict]:
    rng = random.Random(42)
    now_ms = int(time.time() * 1000)
    thirty_days_ms = 30 * 24 * 3600 * 1000

    # Realistic base prices scaled by PRICE_DIV (1_000_000)
    base_prices = {
        "BTC-USDC": 94_000 * 1_000_000,
        "ETH-USDC": 3_200 * 1_000_000,
        "SOL-USDC": 185 * 1_000_000,
    }
    qty_ranges = {
        "BTC-USDC": (0.01, 0.5),
        "ETH-USDC": (0.1, 5.0),
        "SOL-USDC": (1.0, 50.0),
    }

    pairs = list(base_prices.keys())
    trades = []
    for i in range(50):
        pair = pairs[i % len(pairs)]
        side = "buy" if i % 2 == 0 else "sell"
        age_ms = rng.randint(0, thirty_days_ms)
        ts = now_ms - age_ms
        drift = rng.uniform(-0.03, 0.03)
        price = int(base_prices[pair] * (1 + drift))
        lo, hi = qty_ranges[pair]
        size = round(rng.uniform(lo, hi), 4)
        trades.append({"pair": pair, "price": price, "size": size, "side": side, "timestamp": ts})

    trades.sort(key=lambda t: t["timestamp"])
    return trades


async def get_reserves() -> dict:
    token = os.getenv("VELA_ADMIN_TOKEN", "")
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{VELA_BASE}/reserves", headers={"X-Admin-Token": token})
        r.raise_for_status()
        return r.json()
