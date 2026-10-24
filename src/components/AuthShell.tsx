import Image from "next/image";
import type { ReactNode } from "react";
import Logo from "./Logo";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="m-auto w-full max-w-sm py-12">{children}</div>
        <p className="text-xs text-faint">Built for Tetragonula biroi keepers in the Philippines.</p>
      </main>
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/img/stingless-bees.jpg"
          alt="Stingless bees at a hive entrance in Bicol, Philippines"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-10 pt-32 text-white">
          <p className="max-w-sm text-lg font-medium leading-snug">
            Temperature, humidity and hive weight from every box, with a heads-up before conditions hurt the colony.
          </p>
          <p className="mt-3 text-xs text-white/70">Photo: stingless bees in Bicol, Philippines (Wikimedia Commons)</p>
        </div>
      </aside>
    </div>
  );
}
