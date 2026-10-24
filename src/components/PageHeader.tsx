import Link from "next/link";
import type { ReactNode } from "react";

type Props = { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } };

export default function PageHeader({ title, description, actions, back }: Props) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-block text-[13px] text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display text-[34px] leading-[1.05]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-[14px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// Joined stat tiles with hairline dividers.
export function StatStrip({ items }: { items: { label: string; value: ReactNode; hint?: ReactNode; tone?: "default" | "warn" | "good" }[] }) {
  return (
    <dl className={`grid gap-px overflow-hidden rounded-[6px] border border-line bg-line grid-cols-2 ${items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 bg-surface px-5 py-4">
          <dt className="eyebrow">{item.label}</dt>
          <dd className={`num mt-1.5 truncate text-[26px] leading-none font-medium ${item.tone === "warn" ? "text-high" : item.tone === "good" ? "text-good" : ""}`}>
            {item.value}
          </dd>
          {item.hint && <p className="mt-1.5 truncate text-xs text-muted">{item.hint}</p>}
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="display text-[18px]">{children}</h2>
      {aside}
    </div>
  );
}
