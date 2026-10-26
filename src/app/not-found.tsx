import Link from "next/link";

export default function NotFound() {
  return (
    <main className="comb-light grid min-h-dvh place-items-center p-6 text-center">
      <div className="flex flex-col items-center">
        <span className="hex-flat relative grid h-[84px] w-[97px] place-items-center bg-line-strong">
          <span className="hex-flat absolute inset-[2px] bg-paper" aria-hidden />
          <span className="num relative text-sm font-bold text-faint">404</span>
        </span>
        <h1 className="display mt-5 text-[28px]">Nothing in this hive</h1>
        <p className="mt-1 text-sm text-muted">The page you’re looking for doesn’t exist or isn’t yours.</p>
        <Link href="/" className="btn-outline mt-6">
          Back to overview
        </Link>
      </div>
    </main>
  );
}
