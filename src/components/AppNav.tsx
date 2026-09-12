"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, User, Settings, type LucideIcon } from "lucide-react";
import { modules } from "@/modules/registry";

const iconButtonStyle = {
  width: "calc(var(--chrome-size) - 12px)",
  height: "calc(var(--chrome-size) - 12px)",
};

// Simple monotone line icons per module. Keyed by registry `key` so this
// stays easy to extend alongside src/modules/registry.ts.
const moduleIcons: Record<string, LucideIcon> = {
  lists: ClipboardList,
  contacts: User,
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
};

function useNavItems(): NavItem[] {
  const pathname = usePathname();

  return [
    { key: "home", href: "/", label: "famList home", Icon: Home, active: pathname === "/" },
    ...modules.map((mod) => ({
      key: mod.key,
      href: mod.href,
      label: mod.name,
      Icon: moduleIcons[mod.key],
      active: pathname === mod.href || pathname.startsWith(`${mod.href}/`),
    })),
    // Not a data module (no entry in modules/registry.ts) — it's account
    // settings, not a family-data feature, so it's a plain nav item here
    // rather than something the registry loop picks up automatically.
    { key: "settings", href: "/settings", label: "Settings", Icon: Settings, active: pathname === "/settings" },
  ];
}

function NavIcon({ href, label, Icon, active }: NavItem) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      style={iconButtonStyle}
      className={`flex items-center justify-center rounded-md transition-colors ${
        active ? "bg-white/15" : "hover:bg-white/10"
      }`}
    >
      <Icon className="size-5" strokeWidth={1.75} />
    </Link>
  );
}

const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev";
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? "";

/**
 * Build stamp (commit sha + build date). Auto-derived at build time in
 * next.config.ts, so it advances on every commit/deploy with nothing to
 * bump by hand. Handy for confirming a deploy actually landed.
 */
export function BuildTag({ className = "" }: { className?: string }) {
  return (
    <span
      title={BUILD_DATE ? `${BUILD_SHA} · built ${BUILD_DATE}` : BUILD_SHA}
      className={`font-mono text-[10px] leading-none tracking-tight text-white/30 ${className}`}
    >
      {BUILD_SHA}
    </span>
  );
}

/**
 * Desktop/tablet: vertical icon bar down the left edge. Hidden below the
 * `md` breakpoint — on narrow screens the same items move into MobileNav
 * inside the top bar instead, so mobile keeps only a single top bar and
 * gives list/contact content the full screen width.
 */
export function AppSidebar() {
  const items = useNavItems();

  return (
    <nav
      aria-label="Main navigation"
      style={{ width: "var(--chrome-size)" }}
      className="hidden flex-col items-center gap-1 py-2 md:flex"
    >
      {items.map(({ key, ...item }) => (
        <NavIcon key={key} {...item} />
      ))}
      <BuildTag className="mt-auto pb-1" />
    </nav>
  );
}

/** Mobile: the same nav items, laid out horizontally inside the top bar. */
export function MobileNav() {
  const items = useNavItems();

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-1 md:hidden">
      {items.map(({ key, ...item }) => (
        <NavIcon key={key} {...item} />
      ))}
    </nav>
  );
}
