import Image from "next/image";

// The original BeeMo logo. `tone="light"` is the same artwork with cream text for dark surfaces.
export default function Logo({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Image
      src={tone === "light" ? "/img/beemo-logo-light.png" : "/img/beemo-logo.png"}
      alt="BeeMo"
      width={360}
      height={75}
      priority
      className={`h-auto w-[104px] ${className}`}
    />
  );
}
