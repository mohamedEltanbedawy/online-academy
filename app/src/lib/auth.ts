import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "./session";
import { prisma } from "./prisma";

// طبقة الوصول للبيانات (DAL) — كل الأماكن اللي بتطلب "مين المستخدم الحالي" بتمر من هنا

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  return await decrypt(session);
});

// جلب المستخدم الحالي من قاعدة البيانات (من غير الباسورد)
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return user;
});

// لازم المستخدم يكون داخلاً — وإلا يترحّل لصفحة الدخول
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

// لازم المستخدم يكون بدور معين — وإلا يترحّل للوحته
export async function requireRole(...roles: string[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
