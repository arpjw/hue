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

const fmtY = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

export default function EquityCurve({ trades }: Props) {
  const data = useMemo(() => {
    const daily = computeDailyPnl(trades);
    let cumulative = 0;
    return daily.map(({ date, pnl }) => {
      cumulative += pnl;
      return {
        date: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: cumulative,
      };
    });
  }, [trades]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="sageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8D8B0" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#B8D8B0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontFamily: "Courier New", fontSize: 10, fill: "rgba(28,26,24,0.4)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={fmtY}
          tick={{ fontFamily: "Courier New", fontSize: 10, fill: "rgba(28,26,24,0.4)" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const value = (payload[0].value as number) ?? 0;
            return (
              <div className="bg-white rounded-xl border border-hue-border px-3 py-2 shadow-sm">
                <p className="text-xs text-hue-text/50 mb-0.5">{String(label)}</p>
                <p style={{ fontFamily: "Courier New", fontSize: 13, color: "#1C1A18" }}>
                  {value >= 0 ? "+" : ""}
                  {value.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            );
          }}
        />
        <ReferenceLine y={0} stroke="rgba(28,26,24,0.08)" />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#4A8A5A"
          strokeWidth={1.5}
          fill="url(#sageGradient)"
          dot={false}
          activeDot={{ r: 3, fill: "#4A8A5A" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
