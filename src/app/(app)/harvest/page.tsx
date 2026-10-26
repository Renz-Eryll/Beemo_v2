import type { Metadata } from "next";
import { completeCycle, deleteCycle, startCycle } from "@/app/actions/cycles";
import { CYCLE_DAYS, CombMeter } from "@/components/Comb";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import PageHeader, { SectionTitle } from "@/components/PageHeader";
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
  const bestYield = Math.max(0, ...completed.map((c) => c.yieldKg ?? 0));

  return (
    <>
      <PageHeader title="Harvest cycles" description="Each cycle runs about six months, 26 weeks of comb from start to harvest." />

      <section className="hero grid grid-cols-2 gap-6 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-end sm:gap-10 sm:p-8">
        <div className="col-span-2 sm:col-span-1">
          <p className="eyebrow text-rail-muted">Honey harvested</p>
          <p className="num mt-2 text-[40px] leading-none font-medium text-honey sm:text-[48px]">
            {totalYield.toFixed(2)}
            <span className="ml-1.5 text-[20px] text-rail-muted">kg</span>
          </p>
        </div>
        <div>
          <p className="eyebrow text-rail-muted">Harvests</p>
          <p className="num mt-2 text-[28px] leading-none">{completed.length}</p>
        </div>
        <div>
          <p className="eyebrow text-rail-muted">In progress</p>
          <p className="num mt-2 text-[28px] leading-none">{active.length}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-honey-2" aria-hidden />
      </section>

      <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <section>
            <SectionTitle>In progress</SectionTitle>
            {active.length === 0 ? (
              <p className="card comb-light px-5 py-10 text-center text-sm text-muted">No cycles in progress.</p>
            ) : (
              <ul className="space-y-3">
                {active.map((c) => {
                  const days = Math.max(0, Math.round((Date.now() - new Date(c.startDate).getTime()) / 86_400_000));
                  return (
                    <li key={c.id} className="card p-4 sm:p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="display text-[18px]">
                          {c.hiveName} <span className="font-sans text-[13px] font-normal tracking-normal text-muted normal-case">· Cycle {c.cycleNumber}</span>
                        </p>
                        <p className="text-[13px] text-muted">
                          Day <span className="num text-ink">{days}</span> of {CYCLE_DAYS} · ends {dateLabel(c.plannedEndDate)}
                        </p>
                      </div>
                      <div className="mt-3">
                        <CombMeter days={days} />
                      </div>
                      {isAdmin && (
                        <details className="group mt-4 border-t border-dashed border-line pt-3">
                          <summary className="cursor-pointer list-none text-[13px] font-semibold text-honey-text hover:underline [&::-webkit-details-marker]:hidden">
                            <span className="group-open:hidden">+ Record harvest</span>
                            <span className="hidden group-open:inline">− Record harvest</span>
                          </summary>
                          <ActionForm action={completeCycle.bind(null, c.id)} className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-[10rem_8rem_1fr_auto] md:items-end">
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
            <SectionTitle>Honey log</SectionTitle>
            {completed.length === 0 ? (
              <p className="card comb-light px-5 py-10 text-center text-sm text-muted">No harvests recorded yet.</p>
            ) : (
              <ul className="card divide-y divide-line">
                {completed.map((c) => {
                  const share = bestYield > 0 ? (c.yieldKg ?? 0) / bestYield : 0;
                  return (
                    <li
                      key={c.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 gap-y-2 px-5 py-4 md:grid-cols-[13rem_minmax(0,1fr)_auto] md:items-center xl:grid-cols-[15rem_minmax(0,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {c.hiveName} <span className="font-normal text-muted">· Cycle {c.cycleNumber}</span>
                        </p>
                        <p className="text-xs text-faint">
                          {dateLabel(c.startDate)} – {c.completedAt ? dateLabel(c.completedAt) : "—"}
                        </p>
                      </div>
                      {/* Beside the name on phones, at the end of the row from md */}
                      {isAdmin && (
                        <div className="-mt-1 -mr-2.5 md:order-last md:m-0">
                          <ConfirmButton action={deleteCycle.bind(null, c.id)} confirm={`Delete cycle ${c.cycleNumber} of ${c.hiveName}?`} className="btn-ghost h-8 px-2.5 text-[12px]">
                            Delete
                          </ConfirmButton>
                        </div>
                      )}
                      <div className="col-span-2 min-w-0 md:col-span-1">
                        <div className="flex items-center gap-3">
                          <div className="h-3.5 flex-1 bg-sunken">
                            <div className="comb-light hex-ends h-full bg-honey-2" style={{ width: `${Math.max(4, share * 100)}%` }} />
                          </div>
                          <span className="num w-20 shrink-0 text-right text-[15px] font-medium">{c.yieldKg != null ? `${c.yieldKg.toFixed(2)} kg` : "—"}</span>
                        </div>
                        {c.notes && <p className="mt-1 truncate text-xs text-muted">{c.notes}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {isAdmin && (
          <section className="card w-full max-w-xl self-start overflow-hidden xl:max-w-none">
            <div className="comb-dark bg-rail px-5 py-4 text-rail-ink">
              <h2 className="display text-[17px] text-honey">Start a cycle</h2>
              <p className="mt-0.5 text-xs text-rail-muted">Planned end is set 182 days out.</p>
            </div>
            {idleHives.length === 0 ? (
              <p className="p-5 text-sm text-muted">Every hive has a cycle in progress.</p>
            ) : (
              <ActionForm action={startCycle} className="space-y-4 p-5">
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
