import asyncio
from fastapi import APIRouter, HTTPException
from lib.cache import cache
from lib.vela import get_markets, get_trades, get_mock_trades
from lib.calculations import (
    compute_positions,
    compute_var,
    compute_sharpe,
    compute_max_drawdown,
    compute_realized_vol,
    compute_correlation_matrix,
    build_daily_pnl_series,
    build_equity_curve,
)

router = APIRouter()


@router.get("/risk")
async def risk():
    cached = cache.get("risk")
    if cached is not None:
        return cached

    try:
        markets_raw, trades = await asyncio.gather(get_markets(), get_trades())
        trades = trades if isinstance(trades, list) else []
        if not trades:
            trades = get_mock_trades()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Vela unreachable: {e}")

    result = _compute_risk(markets_raw, trades)
    cache.set("risk", result)
    return result


def _compute_risk(markets_raw: dict, trades: list[dict]) -> dict:
    positions = compute_positions(trades, markets_raw)
    aum = sum(p["size"] * p["mark_price"] for p in positions)

    var_95_1d = compute_var(positions, trades, confidence=0.95)
    var_pct_of_aum = var_95_1d / aum if aum > 0 else 0.0

    daily_pnl = build_daily_pnl_series(trades)
    sharpe_30d = compute_sharpe(daily_pnl[-30:] if len(daily_pnl) >= 30 else daily_pnl)

    equity_curve = build_equity_curve(trades)
    max_drawdown = compute_max_drawdown(equity_curve)

    vols = [compute_realized_vol(trades, p["market"]) for p in positions]
    realized_vol_30d = float(sum(vols) / len(vols)) if vols else 0.0

    correlation_matrix = compute_correlation_matrix(positions, trades)

    sorted_pos = sorted(positions, key=lambda p: p["size"] * p["mark_price"], reverse=True)
    concentration = [
        {"market": p["market"], "pct": (p["size"] * p["mark_price"] / aum) if aum > 0 else 0.0}
        for p in sorted_pos[:5]
    ]

    return {
        "var_95_1d": var_95_1d,
        "var_pct_of_aum": var_pct_of_aum,
        "sharpe_30d": sharpe_30d,
        "max_drawdown": max_drawdown,
        "realized_vol_30d": realized_vol_30d,
        "correlation_matrix": correlation_matrix,
        "concentration": concentration,
    }
