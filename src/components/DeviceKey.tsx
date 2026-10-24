"use client";

import { useActionState, useState } from "react";
import type { RotateKeyState } from "@/app/actions/hives";
import { SubmitButton } from "./forms";

type Rotate = (state: RotateKeyState) => Promise<RotateKeyState>;

export default function DeviceKey({ rotate, hint, ingestUrl }: { rotate: Rotate; hint: string | null; ingestUrl: string }) {
  const [state, action] = useActionState(rotate, undefined);
  const [copied, setCopied] = useState(false);
  const key = state?.key;

  const copy = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
  };

  return (
    <div>
      {key ? (
        <div className="rounded-lg border border-honey/40 bg-honey-soft p-4">
          <p className="text-sm font-medium">Copy this key now. It won’t be shown again.</p>
          <div className="mt-3 flex gap-2">
            <code className="num min-w-0 flex-1 truncate rounded-md bg-surface px-3 py-2 text-sm">{key}</code>
            <button type="button" onClick={copy} className="btn-outline">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          {hint ? (
            <>
              Current key ends in <span className="num text-ink">…{hint}</span>
            </>
          ) : (
            "No device key yet."
          )}
        </p>
      )}

      <form
        action={action}
        className="mt-4"
        onSubmit={(e) => {
          if (hint && !window.confirm("Replace the key? The device stops reporting until you flash the new one.")) e.preventDefault();
        }}
      >
        <SubmitButton className="btn-outline" pending="Generating…">
          {hint ? "Replace key" : "Generate device key"}
        </SubmitButton>
      </form>
      {state?.error && <p className="mt-2 text-sm text-high">{state.error}</p>}

      <p className="mt-6 text-xs text-muted">The sensor kit sends readings to</p>
      <code className="num mt-1 block truncate text-sm">POST {ingestUrl}</code>
    </div>
  );
}
