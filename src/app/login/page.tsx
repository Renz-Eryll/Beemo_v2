import type { Metadata } from "next";
import Link from "next/link";
import { login, startDemo } from "@/app/actions/auth";
import AuthShell from "@/components/AuthShell";
import { ActionForm, SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell>
      <h1 className="display text-[34px] leading-none">Sign in</h1>
      <p className="mt-2 text-muted">Welcome back to BeeMo.</p>

      <ActionForm action={login} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
        <SubmitButton className="btn-primary h-10 w-full" pending="Signing in…">
          Sign in
        </SubmitButton>
      </ActionForm>

      <p className="mt-5 text-center text-[13px] text-muted">
        Keeping bees?{" "}
        <Link href="/signup" className="font-semibold text-honey-text hover:underline">
          Create an apiary
        </Link>
      </p>

      <div className="mt-6 border-t border-dashed border-line-strong pt-5">
        <form action={startDemo} className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-muted">Just looking? Explore a sample apiary.</p>
          <SubmitButton className="btn-dark" pending="Opening…">
            Open demo
          </SubmitButton>
        </form>
        {error === "demo" && <p className="mt-2 text-sm text-high">The demo isn’t available right now.</p>}
      </div>
    </AuthShell>
  );
}
