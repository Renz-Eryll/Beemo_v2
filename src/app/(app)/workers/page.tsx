import type { Metadata } from "next";
import { addWorker, removeWorker } from "@/app/actions/members";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { listMembers } from "@/lib/data";
import { dateLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Workers" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default async function WorkersPage() {
  const session = await requireAdmin();
  const members = await listMembers(session.apiaryId);

  return (
    <>
      <PageHeader
        eyebrow={`${members.length} ${members.length === 1 ? "member" : "members"}`}
        title="Workers"
        description="Workers can monitor hives, see alerts and view harvest cycles. Reports and settings stay with the admin."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ul className="grid content-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {members.map((m) => {
            const admin = m.role === "admin";
            return (
              <li key={m.id} className="card flex flex-col">
                <div className="flex items-center gap-4 p-4">
                  <span className={`hex grid h-[52px] w-[45px] shrink-0 place-items-center text-[13px] font-bold ${admin ? "bg-honey-2 text-ink" : "bg-sunken text-muted"}`}>
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {m.name} {m.id === session.userId && <span className="font-normal text-faint">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted">{m.email}</p>
                    {m.phone && <p className="num truncate text-xs text-faint">{m.phone}</p>}
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <span className={`cell-tag capitalize ${admin ? "bg-honey-soft text-honey-text" : "bg-sunken text-muted"}`}>{m.role}</span>
                    since {dateLabel(m.createdAt)}
                  </span>
                  {!admin && (
                    <ConfirmButton action={removeWorker.bind(null, m.id)} confirm={`Remove ${m.name}? They won't be able to sign in.`} className="btn-ghost h-7 px-2 text-[12px]">
                      Remove
                    </ConfirmButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <section className="card w-full max-w-xl self-start overflow-hidden xl:max-w-none">
          <div className="comb-dark bg-rail px-5 py-4 text-rail-ink">
            <h2 className="display text-[17px] text-honey">Add a worker</h2>
            <p className="mt-0.5 text-xs text-rail-muted">Share the temporary password with them in person.</p>
          </div>
          <ActionForm action={addWorker} className="space-y-4 p-5">
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input id="name" name="name" required minLength={2} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Mobile <span className="text-faint">(optional)</span>
              </label>
              <input id="phone" name="phone" type="tel" placeholder="+63 9xx xxx xxxx" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Temporary password
              </label>
              <input id="password" name="password" type="text" required minLength={8} autoComplete="off" className="field num" />
            </div>
            <SubmitButton pending="Adding…">Add worker</SubmitButton>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
