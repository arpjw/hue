"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HueDots from "@/components/ui/HueDots";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", color: "#F5D0A8", bg: "bg-hue-peach" },
  { label: "Positions", href: "/dashboard/positions", color: "#B8D8B0", bg: "bg-hue-sage" },
  { label: "Risk", href: "/dashboard/risk", color: "#F2B8BC", bg: "bg-hue-rose" },
  { label: "Markets", href: "/dashboard/markets", color: "#B4CCE8", bg: "bg-hue-sky" },
  { label: "Settings", href: "/dashboard/settings", color: "#C8B8E4", bg: "bg-hue-lav" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div
      className="flex flex-col h-full bg-white border-r border-hue-border"
      style={{ width: 200 }}
    >
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-hue-border">
        <HueDots size={8} />
        <span className="font-serif text-lg font-bold text-hue-text">Hue</span>
      </div>

      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 py-2.5 pl-5 text-sm font-medium transition-colors ${
                isActive
                  ? `${item.bg} text-hue-text rounded-r-full mr-4`
                  : "text-hue-text/55 hover:text-hue-text"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-5 border-t border-hue-border pt-4">
        <p className="text-xs text-hue-text/35 uppercase tracking-widest mb-3 font-medium">
          Data Sources
        </p>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-2 h-2 rounded-full bg-hue-dsage inline-block" />
          <span className="text-xs text-hue-text/70">Vela Exchange</span>
          <span className="ml-auto text-xs text-hue-dsage font-mono">live</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full border border-hue-border inline-block" />
          <span className="text-xs text-hue-text/40">IBKR Pro</span>
          <span className="ml-auto text-xs text-hue-text/30 font-mono">Phase 2</span>
        </div>
      </div>
    </div>
  );
}
