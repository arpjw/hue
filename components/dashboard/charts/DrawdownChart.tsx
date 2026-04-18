"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { TradeFill } from "@/lib/positions";
import { computeDailyPnl } from "@/lib/charts";

interface Props {
  trades: TradeFill[];
}

export default function DrawdownChart({ trades }: Props) {
  const data = useMemo(() => {
    const daily = computeDailyPnl(trades);
    let cumulative = 0;
    let peak = 0;
    return daily.map(({ date, pnl }) => {
      cumulative += pnl;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak === 0 ? 0 : ((cumulative - peak) / Math.abs(peak)) * 100;
      return {
        date: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: Math.min(drawdown, 0),
      };
    });
  }, [trades]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontFamily: "Courier New", fontSize: 10, fill: "rgba(28,26,24,0.4)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["auto", 0]}
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
          tick={{ fontFamily: "Courier New", fontSize: 10, fill: "rgba(28,26,24,0.4)" }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const value = (payload[0].value as number) ?? 0;
            return (
              <div className="bg-white rounded-xl border border-hue-border px-3 py-2 shadow-sm">
                <p className="text-xs text-hue-text/50 mb-0.5">{String(label)}</p>
                <p style={{ fontFamily: "Courier New", fontSize: 13, color: "#B8505A" }}>
                  {value.toFixed(2)}%
                </p>
              </div>
            );
          }}
        />
        <ReferenceLine y={0} stroke="rgba(28,26,24,0.08)" />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#B8505A"
          strokeWidth={1.5}
          fill="#F2B8BC"
          fillOpacity={0.3}
          dot={false}
          activeDot={{ r: 3, fill: "#B8505A" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
