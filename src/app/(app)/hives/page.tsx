import type { Metadata } from "next";
import Link from "next/link";
import { createHive } from "@/app/actions/hives";
import { ActionForm, SubmitButton } from "@/components/forms";
import { requireSession } from "@/lib/auth";
import { listHives } from "@/lib/data";
import { isOnline, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Hives" };

export default async function HivesPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const session = await requireSession();
  const hives = await listHives(session.apiaryId);
  const { welcome } = await searchParams;
  const isAdmin = session.role === "admin";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Hives</h1>
      {welcome && (
        <p className="mt-2 text-sm text-muted">Your apiary is ready. Add your first hive to get a device key for its sensor kit.</p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="card divide-y divide-line self-start">
          {hives.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">No hives yet.</li>}
          {hives.map((hive) => (
            <li key={hive.id} className="flex items-center gap-4 px-5 py-4">
              <span className={`size-2 shrink-0 rounded-full ${isOnline(hive.lastSeenAt) ? "bg-good" : "bg-faint"}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <Link href={`/hives/${hive.id}`} className="font-medium hover:underline hover:underline-offset-4">
                  {hive.name}
                </Link>
                <p className="truncate text-xs text-faint">
                  {hive.location ?? "No location"} · {hive.lastSeenAt ? `seen ${timeAgo(hive.lastSeenAt)}` : "never connected"}
                </p>
              </div>
              {isAdmin && (
                <Link href={`/hives/${hive.id}/device`} className="btn-ghost">
                  Device
                </Link>
              )}
            </li>
          ))}
        </ul>

        {isAdmin && (
          <section className="card self-start p-5">
            <h2 className="text-sm font-semibold">Add a hive</h2>
            <ActionForm action={createHive} className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input id="name" name="name" required maxLength={60} placeholder="Hive D" className="field" />
              </div>
              <div>
                <label className="label" htmlFor="location">
                  Location <span className="text-faint">(optional)</span>
                </label>
                <input id="location" name="location" maxLength={120} placeholder="Near the mango tree" className="field" />
              </div>
              <SubmitButton pending="Adding…">Add hive</SubmitButton>
            </ActionForm>
          </section>
        )}
      </div>
    </>
  );
}
