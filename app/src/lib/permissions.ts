import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireUser } from "./auth";

// طبقة الصلاحيات (RBAC) — كل الأماكن اللي بتحتاج "هل عنده صلاحية؟" بتمر من هنا
// الأدوار والصلاحيات بتتدار من لوحة الإدارة (AccessRole + Permission + UserRole)

// صلاحيات المستخدم الحالي (cached داخل الطلب الواحد)
export const getMyPermissions = cache(async (): Promise<string[]> => {
  const user = await requireUser();
  const roleIds = await prisma.userRole.findMany({ where: { userId: user.id }, select: { roleId: true } });
  if (roleIds.length === 0) return [];
  const perms = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds.map((r) => r.roleId) } },
    select: { permission: { select: { code: true } } },
  });
  return [...new Set(perms.map((p) => p.permission.code))];
});

// هل عنده صلاحية معينة؟
export async function hasPermission(code: string): Promise<boolean> {
  const perms = await getMyPermissions();
  return perms.includes(code);
}

// لازم تكون عنده الصلاحية — وإلا اترحّل للوحة الرئيسية
export async function requirePermission(code: string) {
  const user = await requireUser();
  const perms = await getMyPermissions();
  if (!perms.includes(code)) redirect("/dashboard");
  return user;
}

// قائمة كل الأدوار الممكنة مع صلاحياتها (لصفحات الإدارة)
export const getAllRoles = cache(async () => {
  return prisma.accessRole.findMany({
    include: { permissions: { include: { permission: true } }, users: { select: { userId: true } } },
    orderBy: { createdAt: "asc" },
  });
});

// قائمة كل الصلاحيات مجمعة حسب الوحدة
export const getAllPermissions = cache(async () => {
  const all = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { label: "asc" }] });
  const grouped = new Map<string, typeof all>();
  for (const p of all) {
    const list = grouped.get(p.module) ?? [];
    list.push(p);
    grouped.set(p.module, list);
  }
  return [...grouped.entries()];
});
