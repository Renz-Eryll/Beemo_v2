import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { deleteHive, rotateDeviceKey, updateHive } from "@/app/actions/hives";
import DeviceKey from "@/components/DeviceKey";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import { requireAdmin } from "@/lib/auth";
import { getHive } from "@/lib/data";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Device & settings" };

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const hive = await getHive(session.apiaryId, (await params).id);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  return (
    <>
      <Link href={`/hives/${hive.id}`} className="text-sm text-muted hover:text-ink">
        ← {hive.name}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Device &amp; settings</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-sm font-semibold">Sensor kit</h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            {hive.lastSeenAt ? `Last reported ${timeAgo(hive.lastSeenAt)}.` : "This hive hasn't reported yet."} Each hive’s ESP8266 uses its own key.
          </p>
          <DeviceKey rotate={rotateDeviceKey.bind(null, hive.id)} hint={hive.deviceKeyHint} ingestUrl={`${origin}/api/ingest`} />
          <Link href="/guide#device" className="mt-5 inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
            Wiring and firmware setup
          </Link>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-sm font-semibold">Details</h2>
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

          <section className="card p-5">
            <h2 className="text-sm font-semibold text-high">Delete hive</h2>
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
