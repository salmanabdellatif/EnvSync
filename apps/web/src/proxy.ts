import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/register", "/docs", "/"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const access_token = req.cookies.get("access_token")?.value;

  const isProtectedRoute = protectedRoutes.includes(pathname);

  if (isProtectedRoute && !access_token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = authRoutes.includes(pathname);
  if (isAuthRoute && access_token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
