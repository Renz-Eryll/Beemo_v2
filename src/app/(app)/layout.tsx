import Link from "next/link";
import { logout } from "@/app/actions/auth";
import Logo from "@/components/Logo";
import { Breadcrumb, SideNav, TopNav, type NavItem } from "@/components/Nav";
import { requireSession } from "@/lib/auth";
import { getApiary, unreadAlertCount } from "@/lib/data";
import { topUpDemoReadings } from "@/lib/demo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (session.demo) await topUpDemoReadings(session.apiaryId);
  const [apiary, unread] = await Promise.all([getApiary(session.apiaryId), unreadAlertCount(session.apiaryId)]);
  const isAdmin = session.role === "admin";
  const initials = session.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const items: NavItem[] = [
    { href: "/", label: "Overview" },
    { href: "/hives", label: "Hives" },
    { href: "/alerts", label: "Alerts", badge: unread },
    { href: "/harvest", label: "Harvest cycles" },
    ...(isAdmin ? [{ href: "/reports", label: "Reports" }, { href: "/workers", label: "Workers" }] : []),
    { href: "/guide", label: "Bee guide" },
  ];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-rail px-3 py-5 text-rail-ink lg:flex">
        <Link href="/" className="px-3">
          <Logo tone="light" />
          <span className="eyebrow mt-1.5 block text-honey">Hive monitoring</span>
        </Link>
        <div className="mx-3 mt-5 border-t border-rail-line" />
        <div className="mt-5 px-3">
          <SideNav items={items} />
        </div>
        <div className="mt-auto flex items-center gap-3 border-t border-rail-line px-3 pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rail-2 text-xs font-semibold text-honey">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{session.name}</p>
            <p className="truncate text-xs text-rail-muted capitalize">{session.demo ? "Demo · read-only" : session.role}</p>
          </div>
          <form action={logout}>
            <button className="grid size-8 place-items-center rounded-[6px] text-rail-muted hover:bg-rail-2 hover:text-rail-ink" title="Sign out" aria-label="Sign out">
              <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile: the rail becomes a top band */}
        <header className="bg-rail px-4 pt-4 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <Link href="/">
              <Logo tone="light" />
            </Link>
            <form action={logout}>
              <button className="text-xs text-rail-muted">Sign out</button>
            </form>
          </div>
          <TopNav items={items} />
        </header>

        <div className="flex h-14 items-center justify-between gap-4 border-b border-line px-4 sm:px-8">
          <Breadcrumb apiary={apiary?.name ?? "Apiary"} items={items} />
          {session.demo && (
            <p className="flex shrink-0 items-center gap-2 text-[13px]">
              <span className="rounded-[4px] bg-honey px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink uppercase">Demo</span>
              <span className="hidden text-muted sm:inline">Read-only, simulated data.</span>
              <Link href="/signup" className="font-semibold text-honey-text hover:underline">
                Create your apiary
              </Link>
            </p>
          )}
        </div>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
