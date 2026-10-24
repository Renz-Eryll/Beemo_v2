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
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1.5 text-sm text-muted">Check on your hives from anywhere.</p>

      <form action={startDemo} className="mt-8">
        <SubmitButton className="btn-outline h-11 w-full" pending="Opening demo…">
          Explore the demo apiary
        </SubmitButton>
      </form>
      {error === "demo" && <p className="mt-2 text-sm text-high">The demo isn’t available right now.</p>}

      <div className="my-6 flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" /> or with your account <span className="h-px flex-1 bg-line" />
      </div>

      <ActionForm action={login}>
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" />
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

      <p className="mt-6 text-center text-sm text-muted">
        Keeping bees?{" "}
        <Link href="/signup" className="font-medium text-ink underline-offset-4 hover:underline">
          Create an apiary
        </Link>
      </p>
    </AuthShell>
  );
}
