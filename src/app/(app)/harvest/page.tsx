import type { Metadata } from "next";
import { completeCycle, deleteCycle, startCycle } from "@/app/actions/cycles";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import { requireSession } from "@/lib/auth";
import { listCycles, listHives } from "@/lib/data";
import { dateLabel, todayIso } from "@/lib/format";

export const metadata: Metadata = { title: "Harvest cycles" };

export default async function HarvestPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const [hives, cycles] = await Promise.all([listHives(session.apiaryId), listCycles(session.apiaryId)]);
  const idleHives = hives.filter((h) => !h.activeCycle);
  const active = cycles.filter((c) => c.status === "active");
  const completed = cycles.filter((c) => c.status === "completed");
  const totalYield = completed.reduce((sum, c) => sum + (c.yieldKg ?? 0), 0);

  return (
    <>
      <h1 className="display text-[34px] leading-[1.05]">Harvest cycles</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Each cycle runs about six months. {completed.length > 0 && `${completed.length} harvests recorded, ${totalYield.toFixed(1)} kg of honey in total.`}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section>
            <h2 className="display text-[17px]">In progress</h2>
            {active.length === 0 ? (
              <p className="card mt-3 px-5 py-8 text-center text-sm text-muted">No cycles in progress.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {active.map((c) => {
                  const days = Math.max(0, Math.round((Date.now() - new Date(c.startDate).getTime()) / 86_400_000));
                  return (
                    <li key={c.id} className="card p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-medium">
                          {c.hiveName} <span className="font-normal text-muted">· Cycle {c.cycleNumber}</span>
                        </p>
                        <p className="text-sm text-muted">
                          Day {days} of 182 · ends {dateLabel(c.plannedEndDate)}
                        </p>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-sunken" aria-hidden>
                        <div className="h-1.5 rounded-full bg-gold" style={{ width: `${Math.min(100, (days / 182) * 100)}%` }} />
                      </div>
                      {isAdmin && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm text-muted hover:text-ink">Record harvest</summary>
                          <ActionForm action={completeCycle.bind(null, c.id)} className="mt-4 grid gap-3 sm:grid-cols-[10rem_8rem_1fr_auto] sm:items-end">
                            <div>
                              <label className="label" htmlFor={`date-${c.id}`}>
                                Harvested on
                              </label>
                              <input id={`date-${c.id}`} name="completedAt" type="date" defaultValue={todayIso()} max={todayIso()} required className="field" />
                            </div>
                            <div>
                              <label className="label" htmlFor={`yield-${c.id}`}>
                                Honey (kg)
                              </label>
                              <input id={`yield-${c.id}`} name="yieldKg" type="number" min="0" step="0.01" required className="field num" />
                            </div>
                            <div>
                              <label className="label" htmlFor={`notes-${c.id}`}>
                                Notes
                              </label>
                              <input id={`notes-${c.id}`} name="notes" maxLength={500} className="field" />
                            </div>
                            <SubmitButton>Save</SubmitButton>
                          </ActionForm>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="display text-[17px]">Completed</h2>
            {completed.length === 0 ? (
              <p className="card mt-3 px-5 py-8 text-center text-sm text-muted">No harvests recorded yet.</p>
            ) : (
              <div className="card mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b border-line [&>th]:eyebrow">
                      <th className="px-5 py-3 font-medium">Hive</th>
                      <th className="px-3 py-3 font-medium">Cycle</th>
                      <th className="px-3 py-3 font-medium">Period</th>
                      <th className="px-3 py-3 font-medium">Honey</th>
                      {isAdmin && <th className="px-5 py-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {completed.map((c) => (
                      <tr key={c.id}>
                        <td className="px-5 py-3">
                          {c.hiveName}
                          {c.notes && <p className="text-xs text-faint">{c.notes}</p>}
                        </td>
                        <td className="num px-3 py-3">{c.cycleNumber}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">
                          {dateLabel(c.startDate)} – {c.completedAt ? dateLabel(c.completedAt) : "—"}
                        </td>
                        <td className="num px-3 py-3">{c.yieldKg != null ? `${c.yieldKg.toFixed(2)} kg` : "—"}</td>
                        {isAdmin && (
                          <td className="px-5 py-3 text-right">
                            <ConfirmButton action={deleteCycle.bind(null, c.id)} confirm={`Delete cycle ${c.cycleNumber} of ${c.hiveName}?`}>
                              Delete
                            </ConfirmButton>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {isAdmin && (
          <section className="card self-start p-5">
            <h2 className="display text-[17px]">Start a cycle</h2>
            {idleHives.length === 0 ? (
              <p className="mt-2 max-w-2xl text-muted">Every hive has a cycle in progress.</p>
            ) : (
              <ActionForm action={startCycle} className="mt-4 space-y-4">
                <div>
                  <label className="label" htmlFor="hiveId">
                    Hive
                  </label>
                  <select id="hiveId" name="hiveId" className="field">
                    {idleHives.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="startDate">
                    Start date
                  </label>
                  <input id="startDate" name="startDate" type="date" defaultValue={todayIso()} max={todayIso()} required className="field" />
                </div>
                <SubmitButton pending="Starting…">Start cycle</SubmitButton>
              </ActionForm>
            )}
          </section>
        )}
      </div>
    </>
  );
}
