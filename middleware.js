import { NextResponse } from "next/server";

export function middleware(req) {
  // Ambil cookie token
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;

  // Proteksi halaman admin
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!token || role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
