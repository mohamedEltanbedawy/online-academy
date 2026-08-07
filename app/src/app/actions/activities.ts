"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type ActivityActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createActivity(state: ActivityActionState, formData: FormData): Promise<ActivityActionState> {
  const creator = await import("@/lib/auth").then(({ requireRole }) => requireRole("ADMIN", "STAFF"));
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const scheduledAt = new Date(String(formData.get("scheduledAt") || ""));
  const location = String(formData.get("location") || "").trim();
  const capacity = Number(formData.get("capacity") || 20);
  const errors: Record<string, string[]> = {};
  if (title.length < 3) errors.title = ["اكتب اسم الفعالية"];
  if (type.length < 2) errors.type = ["اكتب نوع الفعالية"];
  if (Number.isNaN(scheduledAt.getTime())) errors.scheduledAt = ["اختر الموعد"];
  if (!Number.isInteger(capacity) || capacity < 1) errors.capacity = ["السعة يجب أن تكون أكبر من صفر"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.activity.create({ data: { title, type, description: description || null, scheduledAt, location: location || null, capacity, createdById: creator.id } });
  redirect("/admin/activities");
}

export async function recordAttendance(state: ActivityActionState, formData: FormData): Promise<ActivityActionState> {
  const recorder = await import("@/lib/auth").then(({ requireRole }) => requireRole("ADMIN", "STAFF", "TEACHER"));
  const childId = String(formData.get("childId") || "");
  const status = String(formData.get("status") || "");
  const mode = String(formData.get("mode") || "");
  const date = new Date(String(formData.get("date") || ""));
  if (!["PRESENT", "ABSENT", "LATE"].includes(status) || !["ONSITE", "ONLINE"].includes(mode) || Number.isNaN(date.getTime())) return { message: "بيانات الحضور غير صحيحة" };
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  await prisma.childAttendance.upsert({ where: { childId_date_mode: { childId, date: day, mode: mode as "ONSITE" | "ONLINE" } }, update: { status: status as "PRESENT" | "ABSENT" | "LATE", note: String(formData.get("note") || "").trim() || null, recordedById: recorder.id }, create: { childId, date: day, mode: mode as "ONSITE" | "ONLINE", status: status as "PRESENT" | "ABSENT" | "LATE", note: String(formData.get("note") || "").trim() || null, recordedById: recorder.id } });
  redirect(recorder.role === "ADMIN" ? `/admin/children/${childId}` : `/staff/children/${childId}`);
}

export async function enrollChildActivity(activityId: string, childId: string) {
  const { requireRole } = await import("@/lib/auth");
  const parent = await requireRole("PARENT");
  const link = await prisma.childGuardian.findUnique({ where: { childId_guardianId: { childId, guardianId: parent.id } } });
  if (!link) return;
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { enrollments: { where: { status: "REGISTERED" } } } });
  if (!activity) return;
  const status = activity.enrollments.length >= activity.capacity ? "WAITLISTED" : "REGISTERED";
  await prisma.activityEnrollment.upsert({ where: { activityId_childId: { activityId, childId } }, update: { status }, create: { activityId, childId, status } });
  redirect("/parent");
}

export async function toggleActivityActive(activityId: string) {
  const { requireRole } = await import("@/lib/auth");
  const { revalidatePath } = await import("next/cache");
  const admin = await requireRole("ADMIN");
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, select: { active: true } });
  if (!activity) return;
  await prisma.$transaction([
    prisma.activity.update({ where: { id: activityId }, data: { active: !activity.active } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: activity.active ? "DEACTIVATE_ACTIVITY" : "ACTIVATE_ACTIVITY", entity: "Activity", entityId: activityId } }),
  ]);
  revalidatePath("/admin/activities");
}

export async function updateActivity(state: ActivityActionState, formData: FormData): Promise<ActivityActionState> {
  const { requireRole } = await import("@/lib/auth");
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const scheduledAt = new Date(String(formData.get("scheduledAt") || ""));
  const location = String(formData.get("location") || "").trim();
  const capacity = Number(formData.get("capacity") || 0);
  if (title.length < 3 || type.length < 2 || Number.isNaN(scheduledAt.getTime()) || !Number.isInteger(capacity) || capacity < 1) return { message: "بيانات الفعالية غير صحيحة" };
  await prisma.$transaction([
    prisma.activity.update({ where: { id }, data: { title, type, description: description || null, scheduledAt, location: location || null, capacity } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_ACTIVITY", entity: "Activity", entityId: id } }),
  ]);
  const { redirect } = await import("next/navigation");
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/activities");
  redirect("/admin/activities");
}
