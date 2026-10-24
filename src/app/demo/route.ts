import { startDemo } from "@/app/actions/auth";

// Shareable entry point (e.g. from a portfolio): /demo signs into the read-only demo apiary.
export async function GET() {
  await startDemo();
}
