"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; badge?: number };

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

const ICONS: Record<string, React.ReactNode> = {
  "/": <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />,
  "/hives": <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Zm0 6.5L16 12v3l-4 2.3L8 15v-3l4-2.5Z" />,
  "/alerts": <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 3.5a2 2 0 0 0 4 0" />,
  "/harvest": <path d="M7 3v4M17 3v4M4 8h16v12H4V8Zm4 5h3v3H8v-3Z" />,
  "/reports": <path d="M4 20V4m0 16h16M8 16v-4m4 4V8m4 8v-6" />,
  "/workers": <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M21 20a6 6 0 0 0-3.5-5.5" />,
  "/guide": <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15Zm0 15A1.5 1.5 0 0 0 6.5 21H19M9 7h6" />,
};

function NavIcon({ href }: { href: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[href]}
    </svg>
  );
}

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-[6px] px-3 py-2 text-[14px] font-medium transition-colors ${
              active ? "bg-rail-2 text-rail-ink" : "text-rail-muted hover:bg-rail-2/60 hover:text-rail-ink"
            }`}
          >
            {active && (
              <span
                className="hex absolute top-1/2 -left-[15px] h-[14px] w-3 -translate-y-1/2 bg-honey-2"
                aria-hidden
              />
            )}
            <span className={active ? "text-honey" : ""}>
              <NavIcon href={item.href} />
            </span>
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="num cell-tag bg-high py-0 text-[11px] leading-5 text-white" aria-label={`${item.badge} unread`}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function TopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-3">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 py-1.5 text-[13px] font-medium ${active ? "border-honey-2 text-honey" : "border-transparent text-rail-muted"}`}
          >
            {item.label}
            {!!item.badge && <span className="num ml-1.5 text-xs text-[#ff8a7a]">{item.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

// "Apiary › Page" for the top bar.
export function Breadcrumb({ apiary, items }: { apiary: string; items: NavItem[] }) {
  const pathname = usePathname();
  const current = items.find((i) => isActive(pathname, i.href));
  return (
    <p className="truncate text-[13px] text-muted">
      {apiary} <span className="text-faint">›</span> <span className="font-medium text-ink">{current?.label ?? "Overview"}</span>
    </p>
  );
}
