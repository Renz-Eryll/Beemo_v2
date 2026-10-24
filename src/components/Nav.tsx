"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; badge?: number };

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
            isActive(pathname, item.href) ? "bg-sunken font-medium text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {item.label}
          {!!item.badge && (
            <span className="num rounded-full bg-high px-1.5 text-[11px] leading-5 text-white" aria-label={`${item.badge} unread`}>
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function TopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
            isActive(pathname, item.href) ? "bg-ink text-paper" : "bg-surface text-muted"
          }`}
        >
          {item.label}
          {!!item.badge && <span className="num ml-1.5 text-xs opacity-70">{item.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}
