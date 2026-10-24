import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="num text-sm font-bold text-faint">404</p>
        <h1 className="display mt-2 text-[28px]">Nothing in this hive</h1>
        <p className="mt-1 text-sm text-muted">The page you’re looking for doesn’t exist or isn’t yours.</p>
        <Link href="/" className="btn-outline mt-6">
          Back to overview
        </Link>
      </div>
    </main>
  );
}
