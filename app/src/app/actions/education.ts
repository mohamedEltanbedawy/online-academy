"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isMyChild } from "@/lib/education";
import { getMyTenantId } from "@/lib/family";
import type { SubjectType, ScheduleEntryType } from "@prisma/client";

export type EducationActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

async function verifyChildAccess(childId: string) {
  const user = await requireUser();
  const ownChild = await isMyChild(childId);
  const isAdmin = user.role === "ADMIN" || user.role === "STAFF";
  if (!ownChild && !isAdmin) throw new Error("غير مصرح بالوصول لهذا الطفل");
  const tenantId = await getMyTenantId();
  return { user, tenantId };
}

// ============ المواد ============

export async function createSubject(state: EducationActionState, formData: FormData): Promise<EducationActionState> {
  const childId = String(formData.get("childId") || "");
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "SCHOOL");
  const description = String(formData.get("description") || "").trim();
  const bookTitle = String(formData.get("bookTitle") || "").trim();
  const teacher = String(formData.get("teacher") || "").trim();
  if (!name) return { errors: { name: ["اسم المادة مطلوب"] } };
  const { tenantId } = await verifyChildAccess(childId);
  await prisma.subject.create({
    data: { childId, tenantId, name, type: type as SubjectType, description: description || null, bookTitle: bookTitle || null, teacher: teacher || null },
  });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
  return { message: "تمت إضافة المادة." };
}

export async function updateSubject(state: EducationActionState, formData: FormData): Promise<EducationActionState> {
  const id = String(formData.get("id") || "");
  const childId = String(formData.get("childId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { errors: { name: ["اسم المادة مطلوب"] } };
  await verifyChildAccess(childId);
  const type = String(formData.get("type") || "SCHOOL");
  const description = String(formData.get("description") || "").trim();
  const bookTitle = String(formData.get("bookTitle") || "").trim();
  const teacher = String(formData.get("teacher") || "").trim();
  await prisma.subject.update({
    where: { id },
    data: { name, type: type as SubjectType, description: description || null, bookTitle: bookTitle || null, teacher: teacher || null },
  });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
  return { message: "تم تعديل المادة." };
}

export async function deleteSubject(formData: FormData) {
  const id = String(formData.get("id") || "");
  const childId = String(formData.get("childId") || "");
  await verifyChildAccess(childId);
  await prisma.subject.delete({ where: { id } });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
}

// ============ الحصص ============

export async function createLesson(state: EducationActionState, formData: FormData): Promise<EducationActionState> {
  const childId = String(formData.get("childId") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const dateStr = String(formData.get("date") || "");
  const startTime = String(formData.get("startTime") || "").trim();
  const duration = Number(formData.get("duration") || "") || null;
  const teacher = String(formData.get("teacher") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const errors: Record<string, string[]> = {};
  if (!subjectId) errors.subjectId = ["اختر المادة"];
  if (!dateStr) errors.date = ["اختر التاريخ"];
  if (!content) errors.content = ["اكتب محتوى الحصة"];
  if (Object.keys(errors).length > 0) return { errors };
  const { tenantId } = await verifyChildAccess(childId);
  await prisma.tutoringLesson.create({
    data: {
      childId, tenantId, subjectId,
      date: new Date(dateStr),
      startTime: startTime || null,
      duration,
      teacher: teacher || null,
      content,
      notes: notes || null,
    },
  });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
  return { message: "تم تسجيل الحصة." };
}

export async function updateLesson(state: EducationActionState, formData: FormData): Promise<EducationActionState> {
  const id = String(formData.get("id") || "");
  const childId = String(formData.get("childId") || "");
  const content = String(formData.get("content") || "").trim();
  if (!content) return { errors: { content: ["اكتب محتوى الحصة"] } };
  await verifyChildAccess(childId);
  const dateStr = String(formData.get("date") || "");
  const startTime = String(formData.get("startTime") || "").trim();
  const duration = Number(formData.get("duration") || "") || null;
  const teacher = String(formData.get("teacher") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  await prisma.tutoringLesson.update({
    where: { id },
    data: {
      date: new Date(dateStr),
      startTime: startTime || null,
      duration,
      teacher: teacher || null,
      content,
      notes: notes || null,
    },
  });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
  return { message: "تم تعديل الحصة." };
}

export async function deleteLesson(formData: FormData) {
  const id = String(formData.get("id") || "");
  const childId = String(formData.get("childId") || "");
  await verifyChildAccess(childId);
  await prisma.tutoringLesson.delete({ where: { id } });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
}

// ============ الواجبات ============

export async function createHomework(state: EducationActionState, formData: FormData): Promise<EducationActionState> {
  const lessonId = String(formData.get("lessonId") || "");
  const childId = String(formData.get("childId") || "");
  const description = String(formData.get("description") || "").trim();
  const dueDateStr = String(formData.get("dueDate") || "");
  const notes = String(formData.get("notes") || "").trim();
  if (!description) return { errors: { description: ["اكتب وصف الواجب"] } };
  const { tenantId } = await verifyChildAccess(childId);
  await prisma.lessonHomework.create({
    data: {
      lessonId,
      tenantId,
      description,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      notes: notes || null,
    },
  });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
  return { message: "تم إضافة الواجب." };
}

export async function markHomeworkDone(formData: FormData) {
  const id = String(formData.get("id") || "");
  const childId = String(formData.get("childId") || "");
  await verifyChildAccess(childId);
  await prisma.lessonHomework.update({
    where: { id },
    data: { status: "DONE", doneAt: new Date() },
  });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
}

// ============ الجدول الأسبوعي ============

export async function createScheduleEntry(state: EducationActionState, formData: FormData): Promise<EducationActionState> {
  const childId = String(formData.get("childId") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const dayOfWeek = Number(formData.get("dayOfWeek") || 0);
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const type = String(formData.get("type") || "LESSON");
  if (!startTime) return { errors: { startTime: ["وقت البداية مطلوب"] } };
  if (!label) return { errors: { label: ["العنوان مطلوب"] } };
  const { tenantId } = await verifyChildAccess(childId);
  await prisma.weeklySchedule.create({
    data: {
      childId, tenantId,
      subjectId: subjectId || null,
      dayOfWeek,
      startTime,
      endTime: endTime || null,
      label,
      type: type as ScheduleEntryType,
    },
  });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
  return { message: "تم إضافة البند للجدول." };
}

export async function updateScheduleEntry(state: EducationActionState, formData: FormData): Promise<EducationActionState> {
  const id = String(formData.get("id") || "");
  const childId = String(formData.get("childId") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const dayOfWeek = Number(formData.get("dayOfWeek") || 0);
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const type = String(formData.get("type") || "LESSON");
  if (!startTime) return { errors: { startTime: ["وقت البداية مطلوب"] } };
  await verifyChildAccess(childId);
  await prisma.weeklySchedule.update({
    where: { id },
    data: {
      subjectId: subjectId || null,
      dayOfWeek,
      startTime,
      endTime: endTime || null,
      label,
      type: type as ScheduleEntryType,
    },
  });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
  return { message: "تم تعديل البند." };
}

export async function deleteScheduleEntry(formData: FormData) {
  const id = String(formData.get("id") || "");
  const childId = String(formData.get("childId") || "");
  await verifyChildAccess(childId);
  await prisma.weeklySchedule.delete({ where: { id } });
  revalidatePath(`/family/education/${childId}`);
  revalidatePath(`/student`);
}
