import HueDots from "@/components/ui/HueDots";
import ConnectButton from "@/components/ui/ConnectButton";
import OpenDashboardButton from "@/components/ui/OpenDashboardButton";

const PALETTE_STRIP = [
  "#F2B8BC",
  "#F5D0A8",
  "#F0E5A0",
  "#B8D8B0",
  "#A8DDD0",
  "#B4CCE8",
  "#C8B8E4",
];

const FEATURE_CARDS = [
  {
    title: "Live Risk Engine",
    desc: "VaR, Sharpe, drawdown, and correlation computed in real-time from live Vela market data.",
    color: "#F2B8BC",
    deep: "#B8505A",
    icon: "▲",
  },
  {
    title: "Unified Positions",
    desc: "Full position book across all Vela markets with live mark-to-market P&L.",
    color: "#B8D8B0",
    deep: "#4A8A5A",
    icon: "◆",
  },
  {
    title: "P&L Attribution",
    desc: "Day, MTD, and YTD performance with per-asset contribution breakdown.",
    color: "#C8B8E4",
    deep: "#7050A8",
    icon: "●",
  },
];

const METRICS = [
  { dot: "#B8D8B0", label: "Vela Markets", value: "11" },
  { dot: "#B4CCE8", label: "Refresh Rate", value: "60s" },
  { dot: "#F2B8BC", label: "Risk Engine", value: "VaR · Sharpe · Drawdown · Correlation" },
  { dot: "#F5D0A8", label: "Phase 2", value: "IBKR Pro" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-hue-bg">
      <nav className="bg-white border-b border-hue-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HueDots size={9} />
            <span className="font-serif text-xl font-bold text-hue-text">Hue</span>
            <span className="text-sm text-hue-text/40 ml-1">by Monolith Systematic</span>
          </div>
          <ConnectButton />
        </div>
      </nav>

      <div className="flex" style={{ height: 4 }}>
        {PALETTE_STRIP.map((color) => (
          <div key={color} className="flex-1" style={{ background: color }} />
        ))}
      </div>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <h1 className="font-serif leading-tight mb-6" style={{ fontSize: 68, fontWeight: 900 }}>
            Risk in full{" "}
            <span className="italic text-hue-text/45">color.</span>
          </h1>
          <p className="text-lg text-hue-text/60 mb-10 max-w-xl leading-relaxed">
            Hue is a real-time institutional risk dashboard for Monolith Systematic LLC.
            Monitor your Vela positions, track live P&L, and surface risk signals — all in one view.
          </p>
          <ConnectButton className="inline-block px-8 py-3.5 rounded-full bg-hue-text text-white text-base font-medium hover:bg-hue-text/85 transition-colors" />
        </div>
      </section>

      <section className="bg-hue-surface py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-hue-text/40 mb-10 font-medium">Platform</p>
          <div className="grid grid-cols-3 gap-5">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-white border border-hue-border overflow-hidden"
              >
                <div style={{ height: 4, background: card.color }} />
                <div className="p-6">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-sm"
                    style={{ background: card.color, color: card.deep }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-serif text-lg font-bold mb-2 text-hue-text">{card.title}</h3>
                  <p className="text-sm text-hue-text/55 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ background: "#C8B8E4" }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-4xl font-bold text-hue-dlav mb-2">Built for the CIO.</h2>
            <p className="text-hue-dlav/70 text-base max-w-md">
              Institutional-grade risk tooling. Real-time data. Zero compromise.
            </p>
          </div>
          <OpenDashboardButton className="px-7 py-3 rounded-full bg-hue-dlav text-white text-sm font-medium hover:bg-hue-dlav/85 transition-colors" />
        </div>
      </section>

      <div className="bg-hue-text py-3">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-10 overflow-x-auto">
            {METRICS.map((m) => (
              <div key={m.label} className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: m.dot }}
                />
                <span className="text-white/40 text-xs">{m.label}</span>
                <span className="font-mono text-white/80 text-xs">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-hue-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HueDots size={7} />
            <span className="text-sm text-hue-text/60 font-medium">Monolith Systematic LLC</span>
          </div>
          <span className="font-mono text-xs text-hue-text/35">hue.monolithsystematic.com</span>
        </div>
      </footer>
    </div>
  );
}
