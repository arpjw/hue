"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import type { WsStatus } from "@/lib/ws";

interface TopBarProps {
  title: string;
  countdown?: number;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  connectionStatus?: WsStatus;
}

export default function TopBar({ title, countdown, lastUpdated, onRefresh, connectionStatus }: TopBarProps) {
  const [utc, setUtc] = useState("");
  const { address } = useAccount();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtc(
        now.toUTCString().replace("GMT", "UTC").split(" ").slice(1).join(" ")
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-hue-border bg-white">
      <h1 className="font-serif text-2xl font-bold text-hue-text">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-hue-text/50">{utc}</span>
        {(!connectionStatus || connectionStatus === "connected") && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-hue-sage/20 text-hue-dsage text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-hue-dsage animate-pulse inline-block" />
            Live
          </span>
        )}
        {connectionStatus === "connecting" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
            Connecting...
          </span>
        )}
        {(connectionStatus === "disconnected" || connectionStatus === "error") && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-hue-rose/20 text-hue-drose text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-hue-drose animate-pulse inline-block" />
            Reconnecting...
          </span>
        )}
        {countdown !== undefined && onRefresh && (
          <button
            onClick={onRefresh}
            className="font-mono text-xs text-hue-text/50 hover:text-hue-text px-2.5 py-1 rounded-full border border-hue-border hover:border-hue-text/20 transition-colors"
          >
            {countdown}s
          </button>
        )}
        {truncatedAddress && (
          <span className="font-mono text-xs bg-hue-surface px-2.5 py-1 rounded-full text-hue-text/70">
            {truncatedAddress}
          </span>
        )}
      </div>
    </div>
  );
}
