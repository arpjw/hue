"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UsePollingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  countdown: number;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function usePolling<T>(
  url: string,
  intervalMs: number = 60_000
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(intervalMs / 1000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as T;
      setData(json);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setCountdown(intervalMs / 1000);
    }
  }, [url, intervalMs]);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(intervalMs / 1000);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return intervalMs / 1000;
        return c - 1;
      });
    }, 1000);
  }, [intervalMs]);

  useEffect(() => {
    fetchData();
    startCountdown();

    intervalRef.current = setInterval(() => {
      fetchData();
      startCountdown();
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchData, startCountdown, intervalMs]);

  const refresh = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    fetchData();
    startCountdown();
    intervalRef.current = setInterval(() => {
      fetchData();
      startCountdown();
    }, intervalMs);
  }, [fetchData, startCountdown, intervalMs]);

  return { data, loading, error, countdown, lastUpdated, refresh };
}
