"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import TopBar from "@/components/dashboard/TopBar";

const SECTIONS = [
  { id: "wallet", label: "Connected Wallet" },
  { id: "data-sources", label: "Data Sources" },
  { id: "refresh", label: "Refresh Settings" },
  { id: "risk-params", label: "Risk Parameters" },
  { id: "alerts", label: "Alert Thresholds" },
  { id: "display", label: "Display" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const LS_KEYS = {
  priceRefresh: "hue:priceRefresh",
  portfolioRefresh: "hue:portfolioRefresh",
  varConfidence: "hue:varConfidence",
  varHorizon: "hue:varHorizon",
  maxDrawdownAlert: "hue:maxDrawdownAlert",
  varUtilAlert: "hue:varUtilAlert",
  concentrationAlert: "hue:concentrationAlert",
  timezone: "hue:timezone",
} as const;

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex gap-1 p-1 rounded-full bg-hue-surface border border-hue-border ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-hue-text text-white"
              : "text-hue-text/60 hover:text-hue-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, unsaved }: { title: string; unsaved: boolean }) {
  return (
    <div className="px-5 py-3.5 border-b border-hue-border flex items-center gap-3">
      <h2 className="font-serif text-base font-bold">{title}</h2>
      {unsaved && (
        <span className="text-xs text-hue-text/35">Unsaved changes</span>
      )}
    </div>
  );
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-full bg-hue-text text-white text-sm font-medium hover:bg-hue-text/85 transition-colors"
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { data: ensName } = useEnsName({ address, chainId: 1 });

  const [priceRefresh, setPriceRefresh] = useState<"5" | "15" | "30" | "60">("60");
  const [portfolioRefresh, setPortfolioRefresh] = useState<"30" | "60" | "300">("60");
  const [refreshDirty, setRefreshDirty] = useState(false);
  const [refreshSaved, setRefreshSaved] = useState(false);

  const [varConfidence, setVarConfidence] = useState<"90" | "95" | "99">("95");
  const [varHorizon, setVarHorizon] = useState<"1" | "5" | "10">("1");
  const [riskDirty, setRiskDirty] = useState(false);
  const [riskSaved, setRiskSaved] = useState(false);

  const [maxDrawdown, setMaxDrawdown] = useState("15");
  const [varUtil, setVarUtil] = useState("25");
  const [concentration, setConcentration] = useState("30");
  const [alertsDirty, setAlertsDirty] = useState(false);
  const [alertsSaved, setAlertsSaved] = useState(false);

  const [timezone, setTimezone] = useState<"UTC" | "Local">("UTC");
  const [displayDirty, setDisplayDirty] = useState(false);
  const [displaySaved, setDisplaySaved] = useState(false);

  const [velaTesting, setVelaTesting] = useState(false);
  const [velaLatency, setVelaLatency] = useState<number | null>(null);
  const [velaError, setVelaError] = useState<string | null>(null);
  const [velaLastFetch, setVelaLastFetch] = useState<Date | null>(null);

  const [activeSection, setActiveSection] = useState<SectionId>("wallet");
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPriceRefresh(readLS(LS_KEYS.priceRefresh, "60" as "5" | "15" | "30" | "60"));
    setPortfolioRefresh(readLS(LS_KEYS.portfolioRefresh, "60" as "30" | "60" | "300"));
    setVarConfidence(readLS(LS_KEYS.varConfidence, "95" as "90" | "95" | "99"));
    setVarHorizon(readLS(LS_KEYS.varHorizon, "1" as "1" | "5" | "10"));
    setMaxDrawdown(readLS(LS_KEYS.maxDrawdownAlert, "15"));
    setVarUtil(readLS(LS_KEYS.varUtilAlert, "25"));
    setConcentration(readLS(LS_KEYS.concentrationAlert, "30"));
    setTimezone(readLS(LS_KEYS.timezone, "UTC" as "UTC" | "Local"));
  }, []);

  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { root, threshold: 0.25, rootMargin: "0px 0px -55% 0px" }
    );
    for (const s of SECTIONS) {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: SectionId) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const testVela = useCallback(async () => {
    setVelaTesting(true);
    setVelaError(null);
    setVelaLatency(null);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/vela/markets");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setVelaLatency(Math.round(performance.now() - t0));
      setVelaLastFetch(new Date());
    } catch (e) {
      setVelaError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setVelaTesting(false);
    }
  }, []);

  const flashSaved = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const saveRefresh = () => {
    writeLS(LS_KEYS.priceRefresh, priceRefresh);
    writeLS(LS_KEYS.portfolioRefresh, portfolioRefresh);
    setRefreshDirty(false);
    flashSaved(setRefreshSaved);
  };

  const saveRisk = () => {
    writeLS(LS_KEYS.varConfidence, varConfidence);
    writeLS(LS_KEYS.varHorizon, varHorizon);
    setRiskDirty(false);
    flashSaved(setRiskSaved);
  };

  const saveAlerts = () => {
    writeLS(LS_KEYS.maxDrawdownAlert, maxDrawdown);
    writeLS(LS_KEYS.varUtilAlert, varUtil);
    writeLS(LS_KEYS.concentrationAlert, concentration);
    setAlertsDirty(false);
    flashSaved(setAlertsSaved);
  };

  const saveDisplay = () => {
    writeLS(LS_KEYS.timezone, timezone);
    setDisplayDirty(false);
    flashSaved(setDisplaySaved);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Settings" />

      <div className="flex-1 overflow-hidden flex">
        <nav className="w-48 shrink-0 border-r border-hue-border py-5 px-3 flex flex-col gap-0.5 bg-white">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === s.id
                  ? "bg-hue-surface text-hue-text font-medium"
                  : "text-hue-text/45 hover:text-hue-text hover:bg-hue-surface/60"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div
            id="wallet"
            ref={(el) => { sectionRefs.current.wallet = el; }}
            className="rounded-xl bg-white border border-hue-border overflow-hidden"
          >
            <SectionHeader title="Connected Wallet" unsaved={false} />
            <div className="p-5">
              {isConnected && address ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-8">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-hue-text/45 mb-1">Wallet Address</p>
                      <p className="font-mono text-sm text-hue-text break-all">{address}</p>
                    </div>
                    {ensName && (
                      <div className="shrink-0">
                        <p className="text-xs text-hue-text/45 mb-1">ENS Name</p>
                        <p className="font-mono text-sm text-hue-dsage">{ensName}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-hue-border">
                    <button
                      onClick={() => disconnect()}
                      className="px-4 py-1.5 rounded-full border border-hue-border text-sm text-hue-text/60 hover:text-hue-drose hover:border-hue-rose transition-colors"
                    >
                      Disconnect
                    </button>
                    <button
                      onClick={() => openConnectModal?.()}
                      className="px-4 py-1.5 rounded-full bg-hue-text text-white text-sm font-medium hover:bg-hue-text/85 transition-colors"
                    >
                      Switch Wallet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-hue-text/20 shrink-0" />
                  <span className="text-sm text-hue-text/50">No wallet connected</span>
                  <button
                    onClick={() => openConnectModal?.()}
                    className="ml-2 px-4 py-1.5 rounded-full bg-hue-text text-white text-sm font-medium hover:bg-hue-text/85 transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            id="data-sources"
            ref={(el) => { sectionRefs.current["data-sources"] = el; }}
            className="rounded-xl bg-white border border-hue-border overflow-hidden"
          >
            <SectionHeader title="Data Sources" unsaved={false} />
            <div className="p-5 space-y-3">
              <div className="rounded-xl border border-hue-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-hue-dsage shrink-0" />
                    <span className="font-medium text-sm">Vela Exchange</span>
                    <span className="px-2 py-0.5 rounded-full bg-hue-sage/20 text-hue-dsage text-xs font-medium">
                      Live
                    </span>
                  </div>
                  <button
                    onClick={testVela}
                    disabled={velaTesting}
                    className="px-3 py-1 rounded-full border border-hue-border text-xs text-hue-text/60 hover:text-hue-text hover:border-hue-text/20 transition-colors disabled:opacity-40"
                  >
                    {velaTesting ? "Testing…" : "Test Connection"}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-hue-text/40 w-32">Engine URL</span>
                    <span className="font-mono text-xs text-hue-text/70">vela-engine.fly.dev</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-hue-text/40 w-32">Last successful fetch</span>
                    <span className="font-mono text-xs text-hue-text/70">
                      {velaLastFetch
                        ? velaLastFetch.toUTCString().replace("GMT", "UTC")
                        : "—"}
                    </span>
                  </div>
                  {velaLatency !== null && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-hue-text/40 w-32">Latency</span>
                      <span className="font-mono text-xs text-hue-dsage">{velaLatency}ms</span>
                    </div>
                  )}
                  {velaError && (
                    <p className="text-xs text-hue-drose mt-1">{velaError}</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-hue-border p-4 space-y-3 opacity-45 select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-hue-text/25 shrink-0" />
                    <span className="font-medium text-sm">IBKR Pro</span>
                    <span className="px-2 py-0.5 rounded-full bg-hue-surface text-hue-text/40 text-xs font-medium">
                      Phase 2
                    </span>
                  </div>
                  <div className="w-9 h-5 rounded-full bg-hue-text/10 relative cursor-not-allowed">
                    <span className="absolute left-1 top-1 w-3 h-3 rounded-full bg-hue-text/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-hue-text/40 w-32">TWS Host</span>
                    <span className="font-mono text-xs text-hue-text/35">127.0.0.1</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-hue-text/40 w-32">TWS Port</span>
                    <span className="font-mono text-xs text-hue-text/35">7497</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            id="refresh"
            ref={(el) => { sectionRefs.current.refresh = el; }}
            className="rounded-xl bg-white border border-hue-border overflow-hidden"
          >
            <SectionHeader title="Refresh Settings" unsaved={refreshDirty} />
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-0.5">Price Refresh</p>
                  <p className="text-xs text-hue-text/45">How often live prices update</p>
                </div>
                <PillGroup
                  options={[
                    { value: "5", label: "5s" },
                    { value: "15", label: "15s" },
                    { value: "30", label: "30s" },
                    { value: "60", label: "60s" },
                  ]}
                  value={priceRefresh}
                  onChange={(v) => { setPriceRefresh(v); setRefreshDirty(true); }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-0.5">Portfolio Refresh</p>
                  <p className="text-xs text-hue-text/45">How often portfolio data updates</p>
                </div>
                <PillGroup
                  options={[
                    { value: "30", label: "30s" },
                    { value: "60", label: "60s" },
                    { value: "300", label: "5m" },
                  ]}
                  value={portfolioRefresh}
                  onChange={(v) => { setPortfolioRefresh(v); setRefreshDirty(true); }}
                />
              </div>
              <div className="flex justify-end border-t border-hue-border pt-4">
                <SaveButton onClick={saveRefresh} saved={refreshSaved} />
              </div>
            </div>
          </div>

          <div
            id="risk-params"
            ref={(el) => { sectionRefs.current["risk-params"] = el; }}
            className="rounded-xl bg-white border border-hue-border overflow-hidden"
          >
            <SectionHeader title="Risk Parameters" unsaved={riskDirty} />
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-0.5">VaR Confidence Level</p>
                  <p className="text-xs text-hue-text/45">
                    Confidence interval for value-at-risk calculation
                  </p>
                </div>
                <PillGroup
                  options={[
                    { value: "90", label: "90%" },
                    { value: "95", label: "95%" },
                    { value: "99", label: "99%" },
                  ]}
                  value={varConfidence}
                  onChange={(v) => { setVarConfidence(v); setRiskDirty(true); }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-0.5">VaR Horizon</p>
                  <p className="text-xs text-hue-text/45">Holding period for VaR calculation</p>
                </div>
                <PillGroup
                  options={[
                    { value: "1", label: "1d" },
                    { value: "5", label: "5d" },
                    { value: "10", label: "10d" },
                  ]}
                  value={varHorizon}
                  onChange={(v) => { setVarHorizon(v); setRiskDirty(true); }}
                />
              </div>
              <div className="flex justify-end border-t border-hue-border pt-4">
                <SaveButton onClick={saveRisk} saved={riskSaved} />
              </div>
            </div>
          </div>

          <div
            id="alerts"
            ref={(el) => { sectionRefs.current.alerts = el; }}
            className="rounded-xl bg-white border border-hue-border overflow-hidden"
          >
            <SectionHeader title="Alert Thresholds" unsaved={alertsDirty} />
            <div className="p-5 space-y-5">
              <div>
                <label className="text-xs text-hue-text/45 block mb-2">Max Drawdown Alert</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={maxDrawdown}
                    onChange={(e) => { setMaxDrawdown(e.target.value); setAlertsDirty(true); }}
                    className="w-20 px-3 py-1.5 rounded-lg border border-hue-border bg-hue-surface font-mono text-sm text-hue-text focus:outline-none focus:border-hue-text/30 transition-colors"
                  />
                  <span className="text-sm text-hue-text/50">%</span>
                  <span className="text-xs text-hue-text/40">
                    Alert when drawdown exceeds {maxDrawdown || "—"}%
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-hue-text/45 block mb-2">VaR Utilization Alert</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={varUtil}
                    onChange={(e) => { setVarUtil(e.target.value); setAlertsDirty(true); }}
                    className="w-20 px-3 py-1.5 rounded-lg border border-hue-border bg-hue-surface font-mono text-sm text-hue-text focus:outline-none focus:border-hue-text/30 transition-colors"
                  />
                  <span className="text-sm text-hue-text/50">%</span>
                  <span className="text-xs text-hue-text/40">
                    Alert when VaR exceeds {varUtil || "—"}% of AUM
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-hue-text/45 block mb-2">
                  Position Concentration Alert
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={concentration}
                    onChange={(e) => { setConcentration(e.target.value); setAlertsDirty(true); }}
                    className="w-20 px-3 py-1.5 rounded-lg border border-hue-border bg-hue-surface font-mono text-sm text-hue-text focus:outline-none focus:border-hue-text/30 transition-colors"
                  />
                  <span className="text-sm text-hue-text/50">%</span>
                  <span className="text-xs text-hue-text/40">
                    Alert when any single position exceeds {concentration || "—"}% of AUM
                  </span>
                </div>
              </div>
              <div className="flex justify-end border-t border-hue-border pt-4">
                <SaveButton onClick={saveAlerts} saved={alertsSaved} />
              </div>
            </div>
          </div>

          <div
            id="display"
            ref={(el) => { sectionRefs.current.display = el; }}
            className="rounded-xl bg-white border border-hue-border overflow-hidden"
          >
            <SectionHeader title="Display" unsaved={displayDirty} />
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-0.5">Currency</p>
                  <p className="text-xs text-hue-text/45">Display currency for all portfolio values</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-hue-surface border border-hue-border text-xs text-hue-text/50">
                  USD
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-0.5">Timezone</p>
                  <p className="text-xs text-hue-text/45">
                    How timestamps are displayed across the app
                  </p>
                </div>
                <PillGroup
                  options={[
                    { value: "UTC", label: "UTC" },
                    { value: "Local", label: "Local" },
                  ]}
                  value={timezone}
                  onChange={(v) => { setTimezone(v); setDisplayDirty(true); }}
                />
              </div>
              <div className="flex justify-end border-t border-hue-border pt-4">
                <SaveButton onClick={saveDisplay} saved={displaySaved} />
              </div>
            </div>
          </div>

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}
