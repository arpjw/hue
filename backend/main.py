import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

load_dotenv()

from lib.cache import cache
from lib.vela import get_markets, get_trades
from lib.calculations import (
    compute_positions,
    compute_portfolio_stats,
    compute_var,
    compute_sharpe,
    compute_max_drawdown,
    compute_realized_vol,
    compute_correlation_matrix,
    build_daily_pnl_series,
    build_equity_curve,
)
from routers.portfolio import router as portfolio_router
from routers.risk import router as risk_router
from datetime import datetime, timezone


async def warm_cache():
    try:
        markets_raw, trades = await asyncio.gather(get_markets(), get_trades())
        trades = trades if isinstance(trades, list) else []

        positions = compute_positions(trades, markets_raw)
        stats = compute_portfolio_stats(positions, trades)

        cache.set("portfolio", {
            "positions": positions,
            "stats": stats,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        })

        aum = sum(p["size"] * p["mark_price"] for p in positions)
        var_95_1d = compute_var(positions, trades)
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

        cache.set("risk", {
            "var_95_1d": var_95_1d,
            "var_pct_of_aum": var_pct_of_aum,
            "sharpe_30d": sharpe_30d,
            "max_drawdown": max_drawdown,
            "realized_vol_30d": realized_vol_30d,
            "correlation_matrix": correlation_matrix,
            "concentration": concentration,
        })
    except Exception as e:
        print(f"[warm_cache] error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await warm_cache()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(warm_cache, "interval", seconds=55)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3333", "https://hue.monolithsystematic.com"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(portfolio_router)
app.include_router(risk_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
