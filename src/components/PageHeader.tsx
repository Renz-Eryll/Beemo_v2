import Link from "next/link";
import type { ReactNode } from "react";
import { HexMark } from "./Comb";

type Props = { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }; eyebrow?: ReactNode };

export default function PageHeader({ title, description, actions, back, eyebrow }: Props) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="eyebrow mb-2 flex items-center gap-2 text-honey-text">
              <HexMark /> {eyebrow}
            </p>
          )}
          <h1 className="display text-[30px] leading-[1.04] text-balance sm:text-[38px]">{title}</h1>
          {description && <div className="mt-2 max-w-2xl text-[14px] text-muted">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="display flex items-center gap-2.5 text-[18px]">
        <HexMark className="bg-honey-2" size="size-3" />
        {children}
      </h2>
      {aside}
    </div>
  );
}
