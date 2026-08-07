import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

// طبقة عزل المستأجرين (DAL) — البداية التدريجية لـ Family OS
// الفيشر فلاج: TENANT_ISOLATION=true → تفعيل الفلترة الفعلية
// لو المفتاح مش موجود أو false → يشتغل النظام زي ما هو (متوافق مع البيانات الحالية)
// قبل ما نفعل الفلترة لازم كل الجداول التشغيلية تمشي من هنا

const isolationEnabled = () => process.env.TENANT_ISOLATION === "true";

// المستأجر الحالي: مستأجر الشخص المرتبط بحساب المستخدم الحالي
// لو مفيش حساب → يرجع لمستأجر "أكاديمية القرية" الافتراضي (متوافق)
export const getCurrentTenant = cache(async () => {
  const user = await getCurrentUser();
  if (user) {
    const person = await prisma.person.findUnique({
      where: { userId: user.id },
      select: { tenantId: true },
    });
    if (person) {
      const tenant = await prisma.tenant.findUnique({ where: { id: person.tenantId } });
      if (tenant) return tenant;
    }
  }
  return prisma.tenant.findUnique({ where: { slug: "academy" } });
});

// فلتر الـ where لأي استعلام — يضمن عدم رؤية بيانات مستأجر آخر
export async function tenantFilter(field = "tenantId") {
  if (!isolationEnabled()) return {};
  const tenant = await getCurrentTenant();
  return { [field]: tenant?.id ?? "" };
}

// جلب التوأم الرقمي للمستخدم الحالي
export const getCurrentPerson = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.person.findUnique({ where: { userId: user.id } });
});

// جلب عائلات المستخدم الحالي
export const getCurrentFamilies = cache(async () => {
  const person = await getCurrentPerson();
  if (!person) return [];
  return prisma.familyMember.findMany({
    where: { personId: person.id },
    include: {
      family: {
        include: {
          members: {
            include: { person: { select: { id: true, fullName: true, birthDate: true, avatarUrl: true } } },
          },
        },
      },
    },
  });
});

// هل العزل مفعّل؟ (لعرض حالة النظام في لوحة الإدارة)
export function isTenantIsolationEnabled() {
  return isolationEnabled();
}
