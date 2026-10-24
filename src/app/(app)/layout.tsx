import Link from "next/link";
import { logout } from "@/app/actions/auth";
import Logo from "@/components/Logo";
import { SideNav, TopNav, type NavItem } from "@/components/Nav";
import { requireSession } from "@/lib/auth";
import { getApiary, unreadAlertCount } from "@/lib/data";
import { topUpDemoReadings } from "@/lib/demo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (session.demo) await topUpDemoReadings(session.apiaryId);
  const [apiary, unread] = await Promise.all([getApiary(session.apiaryId), unreadAlertCount(session.apiaryId)]);
  const isAdmin = session.role === "admin";

  const items: NavItem[] = [
    { href: "/", label: "Overview" },
    { href: "/hives", label: "Hives" },
    { href: "/alerts", label: "Alerts", badge: unread },
    { href: "/harvest", label: "Harvest cycles" },
    ...(isAdmin ? [{ href: "/reports", label: "Reports" }, { href: "/workers", label: "Workers" }] : []),
    { href: "/guide", label: "Bee guide" },
  ];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-3 py-5 lg:flex">
        <Link href="/" className="px-3">
          <Logo />
        </Link>
        <div className="mt-6 px-3">
          <p className="truncate text-sm font-medium">{apiary?.name}</p>
          {apiary?.location && <p className="truncate text-xs text-faint">{apiary.location}</p>}
        </div>
        <div className="mt-5">
          <SideNav items={items} />
        </div>
        <div className="mt-auto border-t border-line px-3 pt-4">
          <p className="truncate text-sm">{session.name}</p>
          <p className="text-xs capitalize text-faint">{session.demo ? "Demo · read-only" : session.role}</p>
          <form action={logout} className="mt-3">
            <button className="text-xs text-muted hover:text-ink">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-line px-4 pt-4 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>
            <form action={logout}>
              <button className="text-sm text-muted">Sign out</button>
            </form>
          </div>
          <TopNav items={items} />
        </header>

        {session.demo && (
          <div className="border-b border-honey/30 bg-honey-soft px-4 py-2 text-sm text-ink sm:px-8">
            You’re exploring a read-only demo with simulated sensor data.{" "}
            <Link href="/signup" className="font-medium underline underline-offset-2">
              Create your own apiary
            </Link>
          </div>
        )}

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
