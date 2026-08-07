"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export type AuthState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

// ============ تسجيل حساب جديد (مدرس أو طالب) ============
export async function register(
  state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const locale = await getLocale();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "");

  const errors: Record<string, string[]> = {};
  if (name.length < 3) errors.name = [t("الاسم لازم يبقى 3 حروف على الأقل", locale)];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    errors.email = [t("اكتب إيميل صحيح", locale)];
  if (!/^01[0-9]{9}$/.test(phone))
    errors.phone = [t("اكتب رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)", locale)];
  if (password.length < 8)
    errors.password = [t("الباسورد لازم 8 حروف على الأقل", locale)];
  if (role !== "TEACHER" && role !== "STUDENT")
    errors.role = [t("اختر نوع الحساب (مدرس أو طالب)", locale)];

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    return { message: t("الإيميل أو رقم الموبايل مسجل من قبل", locale) };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: role as "TEACHER" | "STUDENT",
    },
  });

  await createSession(user.id, user.role);
  redirect("/dashboard");
}

// ============ دخول ============
export async function login(
  state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const locale = await getLocale();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { message: t("الإيميل أو الباسورد غلط", locale) };
  }

  if (!user.active) {
    return { message: t("الحساب موقوف — تواصل مع الإدارة", locale) };
  }

  await createSession(user.id, user.role);
  redirect("/dashboard");
}

// ============ خروج ============
export async function logout() {
  await deleteSession();
  redirect("/auth/login");
}
