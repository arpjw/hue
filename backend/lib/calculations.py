import numpy as np
from collections import defaultdict
from datetime import datetime, timezone

PRICE_DIV = 1_000_000


def _price(raw: int | float) -> float:
    return raw / PRICE_DIV


def _ts_ms(ts: int | float) -> float:
    return ts if ts > 1e12 else ts * 1000


def compute_positions(trades: list[dict], markets: dict) -> list[dict]:
    fills_by_market: dict[str, list[dict]] = defaultdict(list)
    for t in trades:
        fills_by_market[t["pair"]].append(t)

    results = []
    for market, fills in fills_by_market.items():
        fills = sorted(fills, key=lambda f: f["timestamp"])
        long_lots: list[list[float]] = []
        short_lots: list[list[float]] = []
        realized_pnl = 0.0

        for fill in fills:
            px = _price(fill["price"])
            remaining = float(fill["size"])

            if fill["side"] == "buy":
                while remaining > 1e-10 and short_lots:
                    lot = short_lots[0]
                    matched = min(remaining, lot[1])
                    realized_pnl += (lot[0] - px) * matched
                    lot[1] -= matched
                    remaining -= matched
                    if lot[1] < 1e-10:
                        short_lots.pop(0)
                if remaining > 1e-10:
                    long_lots.append([px, remaining])
            else:
                while remaining > 1e-10 and long_lots:
                    lot = long_lots[0]
                    matched = min(remaining, lot[1])
                    realized_pnl += (px - lot[0]) * matched
                    lot[1] -= matched
                    remaining -= matched
                    if lot[1] < 1e-10:
                        long_lots.pop(0)
                if remaining > 1e-10:
                    short_lots.append([px, remaining])

        if not long_lots and not short_lots:
            continue

        active = long_lots if long_lots else short_lots
        side = "LONG" if long_lots else "SHORT"
        total_qty = sum(lot[1] for lot in active)
        avg_entry = sum(lot[0] * lot[1] for lot in active) / total_qty if total_qty > 0 else 0.0

        market_data = markets.get(market, {})
        if market_data:
            mark_price = (_price(market_data["best_bid"]) + _price(market_data["best_ask"])) / 2
        else:
            mark_price = avg_entry

        unrealized_pnl = (
            (mark_price - avg_entry) * total_qty
            if side == "LONG"
            else (avg_entry - mark_price) * total_qty
        )

        results.append({
            "market": market,
            "side": side,
            "size": total_qty,
            "avg_entry": avg_entry,
            "mark_price": mark_price,
            "unrealized_pnl": unrealized_pnl,
            "realized_pnl": realized_pnl,
            "total_pnl": realized_pnl + unrealized_pnl,
        })

    return results


def compute_portfolio_stats(positions: list[dict], trades: list[dict]) -> dict:
    now = datetime.now(timezone.utc)
    start_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc).timestamp() * 1000
    start_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc).timestamp() * 1000
    start_year = datetime(now.year, 1, 1, tzinfo=timezone.utc).timestamp() * 1000

    total_aum = sum(p["size"] * p["mark_price"] for p in positions)
    total_unrealized = sum(p["unrealized_pnl"] for p in positions)

    fills_by_market: dict[str, list[dict]] = defaultdict(list)
    for t in trades:
        fills_by_market[t["pair"]].append(t)

    closed_legs: list[dict] = []
    for market, fills in fills_by_market.items():
        fills = sorted(fills, key=lambda f: f["timestamp"])
        long_lots: list[list[float]] = []
        short_lots: list[list[float]] = []

        for fill in fills:
            px = _price(fill["price"])
            remaining = float(fill["size"])
            ts = _ts_ms(fill["timestamp"])

            if fill["side"] == "buy":
                while remaining > 1e-10 and short_lots:
                    lot = short_lots[0]
                    matched = min(remaining, lot[1])
                    closed_legs.append({"pnl": (lot[0] - px) * matched, "ts": ts})
                    lot[1] -= matched
                    remaining -= matched
                    if lot[1] < 1e-10:
                        short_lots.pop(0)
                if remaining > 1e-10:
                    long_lots.append([px, remaining])
            else:
                while remaining > 1e-10 and long_lots:
                    lot = long_lots[0]
                    matched = min(remaining, lot[1])
                    closed_legs.append({"pnl": (px - lot[0]) * matched, "ts": ts})
                    lot[1] -= matched
                    remaining -= matched
                    if lot[1] < 1e-10:
                        long_lots.pop(0)
                if remaining > 1e-10:
                    short_lots.append([px, remaining])

    day_realized = sum(l["pnl"] for l in closed_legs if l["ts"] >= start_day)
    mtd_realized = sum(l["pnl"] for l in closed_legs if l["ts"] >= start_month)
    ytd_realized = sum(l["pnl"] for l in closed_legs if l["ts"] >= start_year)

    winning = sum(1 for l in closed_legs if l["pnl"] > 0)
    total_trades = len(trades)
    total_notional = sum(_price(t["price"]) * t["size"] for t in trades)

    return {
        "total_aum": total_aum,
        "day_pnl": day_realized + total_unrealized,
        "mtd_pnl": mtd_realized + total_unrealized,
        "ytd_pnl": ytd_realized + total_unrealized,
        "win_rate": winning / len(closed_legs) if closed_legs else 0.0,
        "total_trades": total_trades,
        "avg_trade_size": total_notional / total_trades if total_trades > 0 else 0.0,
    }


def compute_realized_vol(trades: list[dict], market_id: str, window: int = 30) -> float:
    now_ms = datetime.now(timezone.utc).timestamp() * 1000
    cutoff = now_ms - window * 86_400_000

    market_trades = sorted(
        [t for t in trades if t["pair"] == market_id and _ts_ms(t["timestamp"]) >= cutoff],
        key=lambda t: t["timestamp"],
    )

    if len(market_trades) < 2:
        return 0.40

    prices = [_price(t["price"]) for t in market_trades]
    log_returns = [
        np.log(prices[i] / prices[i - 1])
        for i in range(1, len(prices))
        if prices[i - 1] > 0 and prices[i] > 0
    ]

    if len(log_returns) < 2:
        return 0.40

    return float(np.std(log_returns, ddof=1) * np.sqrt(252))


def compute_var(positions: list[dict], trades: list[dict], confidence: float = 0.95) -> float:
    z = 1.645 if confidence >= 0.95 else 1.282
    total_var = 0.0
    for pos in positions:
        vol = compute_realized_vol(trades, pos["market"])
        daily_vol = vol / np.sqrt(252)
        pos_value = pos["size"] * pos["mark_price"]
        total_var += pos_value * daily_vol * z
    return total_var


def compute_sharpe(daily_pnl_series: list[float]) -> float:
    if len(daily_pnl_series) < 2:
        return 0.0
    arr = np.array(daily_pnl_series, dtype=float)
    std = float(np.std(arr, ddof=1))
    if std == 0.0:
        return 0.0
    return float(np.mean(arr) / std * np.sqrt(252))


def compute_max_drawdown(equity_curve: list[float]) -> float:
    if len(equity_curve) < 2:
        return 0.0
    arr = np.array(equity_curve, dtype=float)
    peak = np.maximum.accumulate(arr)
    with np.errstate(divide="ignore", invalid="ignore"):
        drawdown = np.where(peak != 0, (arr - peak) / np.abs(peak), 0.0)
    return float(np.min(drawdown))


def compute_correlation_matrix(positions: list[dict], trades: list[dict]) -> dict[str, dict[str, float]]:
    markets = [p["market"] for p in positions]
    returns_by_market: dict[str, list[float]] = {}

    for market in markets:
        market_trades = sorted(
            [t for t in trades if t["pair"] == market],
            key=lambda t: t["timestamp"],
        )
        if len(market_trades) < 2:
            returns_by_market[market] = []
            continue
        prices = [_price(t["price"]) for t in market_trades]
        returns_by_market[market] = [
            np.log(prices[i] / prices[i - 1])
            for i in range(1, len(prices))
            if prices[i - 1] > 0 and prices[i] > 0
        ]

    result: dict[str, dict[str, float]] = {}
    for m1 in markets:
        result[m1] = {}
        for m2 in markets:
            if m1 == m2:
                result[m1][m2] = 1.0
                continue
            r1 = returns_by_market.get(m1, [])
            r2 = returns_by_market.get(m2, [])
            min_len = min(len(r1), len(r2))
            if min_len < 2:
                result[m1][m2] = 0.0
            else:
                corr = float(np.corrcoef(r1[:min_len], r2[:min_len])[0, 1])
                result[m1][m2] = corr if not np.isnan(corr) else 0.0

    return result


def build_daily_pnl_series(trades: list[dict]) -> list[float]:
    fills_by_market: dict[str, list[dict]] = defaultdict(list)
    for t in trades:
        fills_by_market[t["pair"]].append(t)

    daily_realized: dict[str, float] = defaultdict(float)

    for market, fills in fills_by_market.items():
        fills = sorted(fills, key=lambda f: f["timestamp"])
        long_lots: list[list[float]] = []
        short_lots: list[list[float]] = []

        for fill in fills:
            px = _price(fill["price"])
            remaining = float(fill["size"])
            day_key = datetime.fromtimestamp(
                _ts_ms(fill["timestamp"]) / 1000, tz=timezone.utc
            ).strftime("%Y-%m-%d")

            if fill["side"] == "buy":
                while remaining > 1e-10 and short_lots:
                    lot = short_lots[0]
                    matched = min(remaining, lot[1])
                    daily_realized[day_key] += (lot[0] - px) * matched
                    lot[1] -= matched
                    remaining -= matched
                    if lot[1] < 1e-10:
                        short_lots.pop(0)
                if remaining > 1e-10:
                    long_lots.append([px, remaining])
            else:
                while remaining > 1e-10 and long_lots:
                    lot = long_lots[0]
                    matched = min(remaining, lot[1])
                    daily_realized[day_key] += (px - lot[0]) * matched
                    lot[1] -= matched
                    remaining -= matched
                    if lot[1] < 1e-10:
                        long_lots.pop(0)
                if remaining > 1e-10:
                    short_lots.append([px, remaining])

    if not daily_realized:
        return []

    return [daily_realized[d] for d in sorted(daily_realized)]


def build_equity_curve(trades: list[dict]) -> list[float]:
    daily_pnl = build_daily_pnl_series(trades)
    if not daily_pnl:
        return []
    return list(np.cumsum(daily_pnl))
