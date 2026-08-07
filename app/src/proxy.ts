import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

// المسارات اللي محتاجة دخول
const protectedRoutes = ["/dashboard", "/profile", "/teacher", "/student", "/join", "/cashier", "/admin", "/parent", "/staff"];
// المسارات العامة (للمش بس)
const publicRoutes = ["/auth/login", "/auth/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r));
  const isPublicRoute = publicRoutes.some((r) => path.startsWith(r));

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  // مش داخل على صفحة محمية → اذهب للدخول
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  // داخل على صفحة دخول/تسجيل وهو مشغل → اذهب للوحته
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
