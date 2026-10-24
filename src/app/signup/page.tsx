import type { Metadata } from "next";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import AuthShell from "@/components/AuthShell";
import { ActionForm, SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Create an apiary" };

export default function SignupPage() {
  return (
    <AuthShell>
      <h1 className="display text-[34px] leading-none">Create your apiary</h1>
      <p className="mt-2 text-muted">You’ll be the admin. Add hives and workers next.</p>

      <ActionForm action={signup} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" autoComplete="name" required minLength={2} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="apiary">
            Apiary name
          </label>
          <input id="apiary" name="apiary" required minLength={2} placeholder="e.g. Sariaya Meliponary" className="field" />
        </div>
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
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="field" />
          <p className="mt-1.5 text-xs text-faint">At least 8 characters</p>
        </div>
        <SubmitButton className="btn-primary h-10 w-full" pending="Creating…">
          Create apiary
        </SubmitButton>
      </ActionForm>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-honey-text hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
