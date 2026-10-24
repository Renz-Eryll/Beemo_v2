import type { Metadata } from "next";
import { addWorker, removeWorker } from "@/app/actions/members";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import { requireAdmin } from "@/lib/auth";
import { listMembers } from "@/lib/data";
import { dateLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Workers" };

export default async function WorkersPage() {
  const session = await requireAdmin();
  const members = await listMembers(session.apiaryId);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Workers</h1>
      <p className="mt-1 text-sm text-muted">Workers can monitor hives, see alerts and view harvest cycles. Reports and settings stay with the admin.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="card divide-y divide-line self-start">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-xs font-semibold text-muted">
                {m.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name} {m.id === session.userId && <span className="font-normal text-faint">(you)</span>}
                </p>
                <p className="truncate text-xs text-faint">
                  {m.email}
                  {m.phone && ` · ${m.phone}`}
                </p>
              </div>
              <span className="hidden text-xs text-muted capitalize sm:inline">
                {m.role} · since {dateLabel(m.createdAt)}
              </span>
              {m.role === "worker" && (
                <ConfirmButton action={removeWorker.bind(null, m.id)} confirm={`Remove ${m.name}? They won't be able to sign in.`}>
                  Remove
                </ConfirmButton>
              )}
            </li>
          ))}
        </ul>

        <section className="card self-start p-5">
          <h2 className="text-sm font-semibold">Add a worker</h2>
          <p className="mt-1 text-xs text-muted">Share the temporary password with them in person.</p>
          <ActionForm action={addWorker} className="mt-4 space-y-4">
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
