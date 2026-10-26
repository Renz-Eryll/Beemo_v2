"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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

// Below lg: a slim bar with a menu button; the menu slides in from the left like the desktop rail.
export function MobileMenu({ items, brand, account }: { items: NavItem[]; brand: ReactNode; account: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const unread = items.some((i) => i.badge);

  // Close after navigating.
  useEffect(() => setOpen(false), [pathname]);

  // Esc closes; the page behind doesn't scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="comb-dark sticky top-0 z-30 flex h-14 items-center justify-between gap-3 bg-rail px-4 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={unread ? "Open menu, unread alerts" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="relative grid size-10 place-items-center rounded-[6px] text-rail-ink hover:bg-rail-2"
        >
          <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
          {unread && <span className="absolute top-2 right-2 size-2 rounded-full bg-high ring-2 ring-rail" aria-hidden />}
        </button>
      </header>

      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-[rgba(16,14,11,0.55)] transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
          aria-hidden
        />
        <aside
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col overflow-y-auto bg-rail px-3 py-4 text-rail-ink transition-transform duration-200 ease-out ${
            open ? "translate-x-0 shadow-[20px_0_50px_-20px_rgba(0,0,0,0.6)]" : "-translate-x-full"
          }`}
        >
          <div className="comb-dark pointer-events-none absolute inset-x-0 bottom-0 h-72 [mask-image:linear-gradient(to_top,black,transparent)]" aria-hidden />
          <div className="relative flex items-center justify-between px-3">
            {brand}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid size-9 place-items-center rounded-[6px] text-rail-muted hover:bg-rail-2 hover:text-rail-ink"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="relative mx-3 mt-4 border-t border-rail-line" />
          <div className="relative mt-4 px-3">
            <SideNav items={items} />
          </div>
          <div className="relative mt-auto pt-6">{account}</div>
        </aside>
      </div>
    </>
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
