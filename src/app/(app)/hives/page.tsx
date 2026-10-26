import type { Metadata } from "next";
import Link from "next/link";
import { createHive } from "@/app/actions/hives";
import { MiniCell } from "@/components/Comb";
import { ActionForm, SubmitButton } from "@/components/forms";
import PageHeader from "@/components/PageHeader";
import { requireSession } from "@/lib/auth";
import { listHives } from "@/lib/data";
import { isOnline, timeAgo } from "@/lib/format";
import { formatValue } from "@/lib/ranges";

export const metadata: Metadata = { title: "Hives" };

export default async function HivesPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const session = await requireSession();
  const hives = await listHives(session.apiaryId);
  const { welcome } = await searchParams;
  const isAdmin = session.role === "admin";

  return (
    <>
      <PageHeader
        eyebrow={`${hives.length} ${hives.length === 1 ? "hive" : "hives"}`}
        title="Hives"
        description={welcome && "Your apiary is ready. Add your first hive to get a device key for its sensor kit."}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {hives.length === 0 ? (
          <p className="card comb-light self-start px-5 py-14 text-center text-sm text-muted">No hives yet.</p>
        ) : (
          <ul className="grid content-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {hives.map((hive) => {
              const live = isOnline(hive.lastSeenAt);
              const r = hive.latest;
              return (
                <li key={hive.id} className="card flex flex-col">
                  <Link href={`/hives/${hive.id}`} className="group flex items-center gap-4 p-4">
                    <MiniCell weight={r?.weightKg ?? null} online={live} />
                    <div className="min-w-0 flex-1">
                      <p className="display truncate text-[17px] group-hover:text-honey-text">{hive.name}</p>
                      <p className="truncate text-xs text-faint">{hive.location ?? "No location"}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                        <span className={`size-1.5 rounded-full ${live ? "bg-good" : "bg-faint"}`} aria-hidden />
                        {live ? "Online" : hive.lastSeenAt ? `Seen ${timeAgo(hive.lastSeenAt)}` : "Never connected"}
                      </p>
                    </div>
                  </Link>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
                    <p className="num truncate text-[12px] text-muted">
                      {r ? `${formatValue("temperature", r.temperature)} · ${formatValue("humidity", r.humidity)} · ${formatValue("weight", r.weightKg)}` : "No readings yet"}
                    </p>
                    {isAdmin && (
                      <Link href={`/hives/${hive.id}/device`} className="btn-ghost h-7 px-2 text-[12px]">
                        Device
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {isAdmin && (
          <section className="card w-full max-w-xl self-start overflow-hidden xl:max-w-none">
            <div className="comb-dark bg-rail px-5 py-4 text-rail-ink">
              <h2 className="display text-[17px] text-honey">Add a hive</h2>
              <p className="mt-0.5 text-xs text-rail-muted">You’ll get a device key for its sensor kit next.</p>
            </div>
            <ActionForm action={createHive} className="space-y-4 p-5">
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
