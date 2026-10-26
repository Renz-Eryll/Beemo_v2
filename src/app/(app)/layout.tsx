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
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-hidden bg-rail px-3 py-5 text-rail-ink lg:flex">
        {/* Comb lattice fading up from the foot of the rail */}
        <div className="comb-dark pointer-events-none absolute inset-x-0 bottom-0 h-72 [mask-image:linear-gradient(to_top,black,transparent)]" aria-hidden />
        <Link href="/" className="relative px-3">
          <Logo tone="light" />
          <span className="eyebrow mt-1.5 block text-honey">Hive monitoring</span>
        </Link>
        <div className="relative mx-3 mt-5 border-t border-rail-line" />
        <div className="relative mt-5 px-3">
          <SideNav items={items} />
        </div>
        <div className="relative mt-auto flex items-center gap-3 border-t border-rail-line px-3 pt-4">
          <span
            className="hex grid h-10 w-9 shrink-0 place-items-center bg-honey-2 text-xs font-bold text-ink"
          >
            {initials}
          </span>
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
        <header className="comb-dark bg-rail px-4 pt-4 lg:hidden">
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

        <div className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-line bg-paper/90 px-4 backdrop-blur sm:px-8">
          <Breadcrumb apiary={apiary?.name ?? "Apiary"} items={items} />
          {session.demo && (
            <p className="flex shrink-0 items-center gap-2 text-[13px]">
              <span className="cell-tag bg-honey tracking-wide text-ink uppercase">Demo</span>
              <span className="hidden text-muted sm:inline">Read-only, simulated data.</span>
              <Link href="/signup" className="font-semibold text-honey-text hover:underline">
                Create your apiary
              </Link>
            </p>
          )}
        </div>

        {/* Left-aligned with the top bar; capped only on very wide screens */}
        <main className="max-w-[1600px] px-4 py-7 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
