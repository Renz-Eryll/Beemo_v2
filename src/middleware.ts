import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/signup", "/demo"];

// Redirect signed-out visitors to /login and signed-in ones away from the auth pages.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!session && !isPublic) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  // Demo visitors may still open /signup to create a real account.
  if (session && (pathname === "/login" || (pathname === "/signup" && !session.demo))) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip API routes (they authenticate themselves), Next internals and static files.
  matcher: ["/((?!api/|_next/|favicon.ico|icon.svg|img/|firmware/).*)"],
};
