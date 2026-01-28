import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard"];
const authPaths = [
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
  "/verify-email",
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const access_token = req.cookies.get("access_token")?.value;

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  // Allow auth pages with cli_state param (for CLI auth flow)
  const hasCLIState = req.nextUrl.searchParams.has("cli_state");
  const isAuthRoute =
    !hasCLIState && authPaths.some((path) => pathname.startsWith(path));

  if (isProtectedRoute && !access_token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For CLI auth with existing session, redirect to dashboard with cli_state
  if (hasCLIState && access_token && pathname.startsWith("/login")) {
    const cliState = req.nextUrl.searchParams.get("cli_state");
    const dashboardUrl = new URL("/dashboard", req.url);
    dashboardUrl.searchParams.set("cli_state", cliState!);
    return NextResponse.redirect(dashboardUrl);
  }

  if (isAuthRoute && access_token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
