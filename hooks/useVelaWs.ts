"use client";

import { useState, useEffect, useRef } from "react";
import { VelaWebSocket, type WsStatus } from "@/lib/ws";
import type { VelaMarket } from "@/lib/vela";

export function useVelaWs(): {
  markets: Record<string, VelaMarket>;
  connectionStatus: WsStatus;
} {
  const [markets, setMarkets] = useState<Record<string, VelaMarket>>({});
  const [connectionStatus, setConnectionStatus] = useState<WsStatus>("disconnected");
  const wsRef = useRef<VelaWebSocket | null>(null);
  const wsConnectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    const applyMarkets = (incoming: VelaMarket[]) => {
      setMarkets((prev) => {
        const next = { ...prev };
        for (const m of incoming) next[m.id] = m;
        return next;
      });
    };

    const handleMessage = (data: unknown) => {
      if (Array.isArray(data)) {
        applyMarkets(data as VelaMarket[]);
      } else if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (typeof d.id === "string") {
          setMarkets((prev) => ({ ...prev, [d.id as string]: d as unknown as VelaMarket }));
        } else if (Array.isArray(d.markets)) {
          applyMarkets(d.markets as VelaMarket[]);
        }
      }
    };

    const startFallback = () => {
      if (fallbackInterval) return;
      const poll = async () => {
        if (wsConnectedRef.current) return;
        try {
          const res = await fetch("/api/vela/markets");
          if (!res.ok || wsConnectedRef.current) return;
          const data = (await res.json()) as VelaMarket[];
          if (!wsConnectedRef.current) {
            setMarkets(() => {
              const next: Record<string, VelaMarket> = {};
              for (const m of data) next[m.id] = m;
              return next;
            });
          }
        } catch {
          // ignore fetch errors in fallback
        }
      };
      poll();
      fallbackInterval = setInterval(poll, 60_000);
    };

    const stopFallback = () => {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
    };

    const init = async () => {
      let wsUrl = "wss://vela-engine.fly.dev/ws";
      try {
        const res = await fetch("/api/vela/state");
        if (res.ok) {
          const state = (await res.json()) as Record<string, unknown>;
          if (typeof state?.ws_url === "string") wsUrl = state.ws_url;
        }
      } catch {
        // use fallback URL
      }
      if (cancelled) return;

      const ws = new VelaWebSocket(
        handleMessage,
        (status) => {
          setConnectionStatus(status);
          if (status === "connected") {
            wsConnectedRef.current = true;
            stopFallback();
          } else {
            wsConnectedRef.current = false;
            startFallback();
          }
        },
        wsUrl
      );
      wsRef.current = ws;
      ws.connect();
    };

    init();

    return () => {
      cancelled = true;
      wsRef.current?.disconnect();
      wsRef.current = null;
      stopFallback();
    };
  }, []);

  return { markets, connectionStatus };
}
