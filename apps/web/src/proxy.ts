import { NextRequest, NextResponse } from "next/server";
import isTokenValid from "./lib/validateToken";

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

  // Check if token exists AND is not expired
  const hasValidToken = access_token && isTokenValid(access_token);

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  // Allow auth pages with cli_state param (for CLI auth flow)
  const hasCLIState = req.nextUrl.searchParams.has("cli_state");
  const isAuthRoute =
    !hasCLIState && authPaths.some((path) => pathname.startsWith(path));

  // Protected route with no valid token -> redirect to login
  if (isProtectedRoute && !hasValidToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);

    // Clear the expired cookie by setting it to expire immediately
    const response = NextResponse.redirect(loginUrl);
    if (access_token && !hasValidToken) {
      response.cookies.delete("access_token");
    }
    return response;
  }

  // For CLI auth with existing valid session, redirect to dashboard with cli_state
  if (hasCLIState && hasValidToken && pathname.startsWith("/login")) {
    const cliState = req.nextUrl.searchParams.get("cli_state");
    const dashboardUrl = new URL("/dashboard", req.url);
    dashboardUrl.searchParams.set("cli_state", cliState!);
    return NextResponse.redirect(dashboardUrl);
  }

  // Auth route with valid token -> redirect to dashboard
  if (isAuthRoute && hasValidToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
