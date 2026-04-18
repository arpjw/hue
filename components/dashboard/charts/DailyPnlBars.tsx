"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
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

export default function DailyPnlBars({ trades }: Props) {
  const data = useMemo(
    () =>
      computeDailyPnl(trades).map(({ date, pnl }) => ({
        date: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: pnl,
      })),
    [trades]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
          cursor={{ fill: "rgba(28,26,24,0.04)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const value = (payload[0].value as number) ?? 0;
            return (
              <div className="bg-white rounded-xl border border-hue-border px-3 py-2 shadow-sm">
                <p className="text-xs text-hue-text/50 mb-0.5">{String(label)}</p>
                <p
                  style={{
                    fontFamily: "Courier New",
                    fontSize: 13,
                    color: value >= 0 ? "#4A8A5A" : "#B8505A",
                  }}
                >
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
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.value >= 0 ? "#B8D8B0" : "#F2B8BC"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
