from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from lib.cache import cache
from lib.vela import get_markets, get_trades, get_mock_trades
from lib.calculations import compute_positions, compute_portfolio_stats

router = APIRouter()


@router.get("/portfolio")
async def portfolio():
    cached = cache.get("portfolio")
    if cached is not None:
        return cached

    try:
        markets_raw, trades = await _fetch_vela()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Vela unreachable: {e}")

    positions = compute_positions(trades, markets_raw)
    stats = compute_portfolio_stats(positions, trades)

    result = {
        "positions": positions,
        "stats": stats,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    cache.set("portfolio", result)
    return result


async def _fetch_vela():
    import asyncio
    markets_raw, trades = await asyncio.gather(get_markets(), get_trades())
    trades = trades if isinstance(trades, list) else []
    if not trades:
        trades = get_mock_trades()
    return markets_raw, trades
