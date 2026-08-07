"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getMyTenantId, getMyFamilyMemberships } from "@/lib/family";

export type FamilyActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

// نطاق المستخدم الحالي: أرقام العائلات اللي هو عضو فيها
async function getScope() {
  const user = await requireUser();
  const tenantId = await getMyTenantId();
  const memberships = await getMyFamilyMemberships();
  const familyIds = memberships.map((m) => m.family.id);
  return { user, tenantId, familyIds };
}

// هل العائلة في نطاق المستخدم؟
function inScope(familyIds: string[], familyId?: string | null) {
  if (!familyId) return true; // بدون عائلة = على مستوى المستأجر
  return familyIds.includes(familyId);
}

// ============ التقويم العائلي ============
export async function createEvent(state: FamilyActionState, formData: FormData): Promise<FamilyActionState> {
  const { tenantId, familyIds } = await getScope();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "CUSTOM");
  const startsAt = new Date(String(formData.get("startsAt") || ""));
  const endsAtRaw = String(formData.get("endsAt") || "");
  const location = String(formData.get("location") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const familyId = String(formData.get("familyId") || "").trim() || null;
  const errors: Record<string, string[]> = {};
  if (title.length < 2) errors.title = ["اكتب عنوان الحدث"];
  if (!["LESSON", "ACTIVITY", "APPOINTMENT", "BIRTHDAY", "CUSTOM"].includes(type)) errors.type = ["نوع الحدث غير صحيح"];
  if (Number.isNaN(startsAt.getTime())) errors.startsAt = ["اختر موعد الحدث"];
  if (!inScope(familyIds, familyId)) errors.familyId = ["أنت مش عضو في هذه العائلة"];
  if (Object.keys(errors).length > 0) return { errors };

  const person = await prisma.person.findUnique({ where: { userId: (await requireUser()).id } });
  await prisma.familyEvent.create({
    data: {
      tenantId,
      familyId,
      title,
      type: type as "LESSON" | "ACTIVITY" | "APPOINTMENT" | "BIRTHDAY" | "CUSTOM",
      startsAt,
      endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
      location: location || null,
      notes: notes || null,
      createdById: person?.id ?? null,
    },
  });
  revalidatePath("/family");
  revalidatePath("/family/events");
  revalidatePath("/family/calendar");
  redirect("/family/events");
}

export async function toggleEventDone(eventId: string) {
  const { tenantId } = await getScope();
  const event = await prisma.familyEvent.findUnique({ where: { id: eventId } });
  if (!event || event.tenantId !== tenantId) return;
  await prisma.familyEvent.update({ where: { id: eventId }, data: { completed: !event.completed } });
  revalidatePath("/family");
  revalidatePath("/family/events");
  revalidatePath("/family/calendar");
}

export async function deleteEvent(eventId: string) {
  const { tenantId } = await getScope();
  const event = await prisma.familyEvent.findUnique({ where: { id: eventId } });
  if (!event || event.tenantId !== tenantId) return;
  await prisma.familyEvent.delete({ where: { id: eventId } });
  revalidatePath("/family");
  revalidatePath("/family/events");
  revalidatePath("/family/calendar");
}

// ============ الخطة اليومية ============
export async function createPlanItem(state: FamilyActionState, formData: FormData): Promise<FamilyActionState> {
  const { tenantId, familyIds } = await getScope();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "TASK");
  const dayRaw = String(formData.get("day") || "");
  const time = String(formData.get("time") || "").trim() || null;
  const assignedToId = String(formData.get("assignedToId") || "").trim() || null;
  const familyId = String(formData.get("familyId") || "").trim() || null;
  const errors: Record<string, string[]> = {};
  const day = dayRaw ? new Date(`${dayRaw}T00:00:00`) : null;
  if (title.length < 2) errors.title = ["اكتب عنوان المهمة"];
  if (!["TASK", "LESSON", "ACTIVITY", "REMINDER"].includes(type)) errors.type = ["نوع المهمة غير صحيح"];
  if (!day || Number.isNaN(day.getTime())) errors.day = ["اختر اليوم"];
  if (!inScope(familyIds, familyId)) errors.familyId = ["أنت مش عضو في هذه العائلة"];
  if (Object.keys(errors).length > 0) return { errors };

  await prisma.planItem.create({
    data: { tenantId, familyId, day: day!, title, type: type as "TASK" | "LESSON" | "ACTIVITY" | "REMINDER", time, assignedToId },
  });
  revalidatePath("/family");
  revalidatePath("/family/plan");
  redirect("/family/plan");
}

export async function togglePlanItemDone(itemId: string) {
  const { tenantId } = await getScope();
  const item = await prisma.planItem.findUnique({ where: { id: itemId } });
  if (!item || item.tenantId !== tenantId) return;
  await prisma.planItem.update({ where: { id: itemId }, data: { done: !item.done, doneAt: item.done ? null : new Date() } });
  revalidatePath("/family");
  revalidatePath("/family/plan");
}

export async function deletePlanItem(itemId: string) {
  const { tenantId } = await getScope();
  const item = await prisma.planItem.findUnique({ where: { id: itemId } });
  if (!item || item.tenantId !== tenantId) return;
  await prisma.planItem.delete({ where: { id: itemId } });
  revalidatePath("/family");
  revalidatePath("/family/plan");
}
