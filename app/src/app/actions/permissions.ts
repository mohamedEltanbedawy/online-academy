"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// إعادة تعيين صلاحيات دور من اللوحة (checkbox لكل صلاحية)
export async function saveRolePermissions(roleId: string, formData: FormData) {
  await requireRole("ADMIN");
  const role = await prisma.accessRole.findUnique({ where: { id: roleId } });
  if (!role) return;

  const allPermissions = await prisma.permission.findMany();
  const selected = allPermissions
    .filter((p) => formData.get(`perm:${p.code}`) === "on")
    .map((p) => p.id);

  // أعد ضبط: حذف القديم + إضافة الجديد
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  if (selected.length > 0) {
    await prisma.rolePermission.createMany({ data: selected.map((permissionId) => ({ roleId, permissionId })) });
  }
  revalidatePath("/admin/permissions");
}

// إضافة دور جديد
export async function createRole(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const label = String(formData.get("label") || "").trim();
  if (!name || !label) return;
  await prisma.accessRole.create({ data: { name, label } });
  revalidatePath("/admin/permissions");
  redirect("/admin/permissions");
}

// حذف دور (غير النظامي)
export async function deleteRole(roleId: string) {
  await requireRole("ADMIN");
  const role = await prisma.accessRole.findUnique({ where: { id: roleId } });
  if (!role || role.isSystem) return;
  await prisma.accessRole.delete({ where: { id: roleId } });
  revalidatePath("/admin/permissions");
}

// إضافة صلاحية جديدة من اللوحة (مطلوب عند إضافة وحدة جديدة)
export async function createPermission(formData: FormData) {
  await requireRole("ADMIN");
  const code = String(formData.get("code") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const moduleName = String(formData.get("module") || "").trim();
  if (!code || !label || !moduleName) return;
  const existing = await prisma.permission.findUnique({ where: { code } });
  if (existing) return;
  await prisma.permission.create({ data: { code, label, module: moduleName } });
  revalidatePath("/admin/permissions");
}

// إسناد أدوار لمستخدم معين
export async function saveUserRoles(userId: string, formData: FormData) {
  await requireRole("ADMIN");
  const roles = await prisma.accessRole.findMany();
  const selected = roles.filter((r) => formData.get(`role:${r.name}`) === "on");
  await prisma.userRole.deleteMany({ where: { userId } });
  if (selected.length > 0) {
    await prisma.userRole.createMany({ data: selected.map((role) => ({ userId, roleId: role.id })) });
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin/permissions");
}
