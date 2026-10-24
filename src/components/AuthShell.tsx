import Image from "next/image";
import type { ReactNode } from "react";
import Logo from "./Logo";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-rail p-12 text-rail-ink lg:flex lg:flex-col">
        <Image src="/img/stingless-bees.jpg" alt="" fill priority sizes="50vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-t from-rail via-rail/70 to-rail/40" aria-hidden />
        <div className="relative">
          <Logo tone="light" className="w-[150px]" />
          <p className="eyebrow mt-2 text-honey">Stingless beehive monitoring</p>
        </div>
        <div className="relative mt-auto">
          <p className="display text-[44px] leading-[1.02]">
            Every hive.
            <br />
            <span className="text-honey">Every reading.</span>
          </p>
          <p className="mt-4 max-w-sm text-[14px] text-rail-muted">
            Temperature, humidity and weight from each box, with a heads-up before conditions hurt the colony.
          </p>
          <p className="mt-8 text-[11px] text-rail-muted/70">Photo: stingless bees in Bicol, Philippines (Wikimedia Commons)</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-honey" aria-hidden />
      </aside>

      <main className="flex flex-col bg-paper px-6 py-8 sm:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="m-auto w-full max-w-[400px] py-12">{children}</div>
      </main>
    </div>
  );
}
