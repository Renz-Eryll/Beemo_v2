import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { deleteHive, rotateDeviceKey, updateHive } from "@/app/actions/hives";
import DeviceKey from "@/components/DeviceKey";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { getHive } from "@/lib/data";
import { isOnline, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Device & settings" };

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const hive = await getHive(session.apiaryId, (await params).id);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const online = isOnline(hive.lastSeenAt);

  return (
    <>
      <PageHeader back={{ href: `/hives/${hive.id}`, label: hive.name }} eyebrow={hive.name} title="Device & settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card self-start overflow-hidden">
          <div className="comb-dark flex items-center justify-between gap-3 bg-rail px-5 py-4 text-rail-ink">
            <div>
              <h2 className="display text-[17px] text-honey">Sensor kit</h2>
              <p className="mt-0.5 text-xs text-rail-muted">Each hive’s ESP8266 uses its own key.</p>
            </div>
            <span className={`cell-tag ${online ? "bg-good-bright/20 text-good-bright" : "bg-rail-2 text-rail-muted"}`}>
              <span className={`size-1.5 rounded-full ${online ? "bg-good-bright" : "bg-rail-muted"}`} aria-hidden />
              {hive.lastSeenAt ? `Reported ${timeAgo(hive.lastSeenAt)}` : "Not reported yet"}
            </span>
          </div>
          <div className="p-5">
            <DeviceKey rotate={rotateDeviceKey.bind(null, hive.id)} hint={hive.deviceKeyHint} ingestUrl={`${origin}/api/ingest`} />
            <Link href="/guide#device" className="mt-5 inline-block text-sm font-semibold text-honey-text underline-offset-4 hover:underline">
              Wiring and firmware setup →
            </Link>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="display text-[17px]">Details</h2>
            <ActionForm action={updateHive.bind(null, hive.id)} className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input id="name" name="name" defaultValue={hive.name} required maxLength={60} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="location">
                  Location
                </label>
                <input id="location" name="location" defaultValue={hive.location ?? ""} maxLength={120} className="field" />
              </div>
              <SubmitButton>Save</SubmitButton>
            </ActionForm>
          </section>

          <section className="card border-high/30 bg-[repeating-linear-gradient(-45deg,transparent_0_12px,var(--color-high-soft)_12px_13px)] p-5">
            <h2 className="display text-[17px] text-high">Delete hive</h2>
            <p className="mt-1 mb-4 text-sm text-muted">Removes the hive with all its readings, cycles and alerts.</p>
            <ConfirmButton
              action={deleteHive.bind(null, hive.id)}
              confirm={`Delete ${hive.name} and all its data? This can't be undone.`}
              className="btn-danger"
            >
              Delete hive
            </ConfirmButton>
          </section>
        </div>
      </div>
    </>
  );
}
