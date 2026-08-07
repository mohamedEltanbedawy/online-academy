"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type ClassActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

const DAY_REGEX = /^\d{2}:\d{2}$/;

// توليد كود دعوة قصير (من غير حروف/أرقام متشابهة)
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[randomInt(chars.length)];
  }
  return code;
}

// ============ المدرس يعمل فصل جديد ============
export async function createClass(
  state: ClassActionState,
  formData: FormData
): Promise<ClassActionState> {
  const teacher = await requireRole("TEACHER");

  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const pricePerHour = Number(formData.get("pricePerHour"));
  const platformPercent = Number(formData.get("platformPercent") || 0);
  const fixedFee = Number(formData.get("fixedFee") || 0);

  const errors: Record<string, string[]> = {};
  if (name.length < 2) errors.name = ["اسم الفصل لازم يبقى حرفين على الأقل"];
  if (subject.length < 2) errors.subject = ["اكتب المادة"];
  if (!Number.isFinite(pricePerHour) || pricePerHour <= 0)
    errors.pricePerHour = ["سعر الحصة لازم يكون أكبر من صفر"];
  if (!Number.isFinite(platformPercent) || platformPercent < 0 || platformPercent > 100)
    errors.platformPercent = ["النسبة من 0 لـ 100"];
  if (!Number.isFinite(fixedFee) || fixedFee < 0)
    errors.fixedFee = ["اكتب كلفة صحيحة"];

  if (Object.keys(errors).length > 0) return { errors };

  let inviteCode = generateInviteCode();
  while (await prisma.class.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  const cls = await prisma.class.create({
    data: {
      teacherId: teacher.id,
      name,
      subject,
      description: description || null,
      pricePerHour,
      platformPercent,
      fixedFee,
      inviteCode,
    },
  });

  redirect(`/teacher/classes/${cls.id}`);
}

// ============ الطالب ينضم لفصل بكود دعوة ============
export async function joinClass(
  state: ClassActionState,
  formData: FormData
): Promise<ClassActionState> {
  const student = await requireRole("STUDENT");

  const code = String(formData.get("code") || "").trim().toUpperCase();
  const source = String(formData.get("source") || "");

  const errors: Record<string, string[]> = {};
  if (code.length < 4) errors.code = ["اكتب كود الدعوة"];

  const cls = await prisma.class.findUnique({ where: { inviteCode: code } });
  if (!cls || cls.status !== "ACTIVE") {
    errors.code = ["الكود مش صحيح أو الفصل متقفل"];
    return { errors };
  }

  if (source !== "PLATFORM" && source !== "TEACHER") {
    errors.source = ["اختر طريقة دخولك"];
    return { errors };
  }

  const existing = await prisma.enrollment.findUnique({
    where: { classId_studentId: { classId: cls.id, studentId: student.id } },
  });
  if (existing) {
    return existing.status === "ACTIVE"
      ? { message: "أنت مشترك بالفعل في الفصل ده" }
      : { message: "دخولك للفصل ده مقفول — كلم المدرس" };
  }

  await prisma.enrollment.create({
    data: {
      classId: cls.id,
      studentId: student.id,
      source: source as "PLATFORM" | "TEACHER",
    },
  });

  redirect("/student");
}

// ============ الطالب يسيب الفصل ============
export async function leaveClass(classId: string) {
  const student = await requireRole("STUDENT");
  await prisma.enrollment.updateMany({
    where: { classId, studentId: student.id },
    data: { status: "LEFT" },
  });
  redirect("/student");
}

// ============ المدرس يمنع طالب ============
export async function blockStudent(classId: string, studentId: string) {
  const teacher = await requireRole("TEACHER");
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.id },
  });
  if (!cls) return;
  await prisma.enrollment.update({
    where: { classId_studentId: { classId, studentId } },
    data: { status: "BLOCKED" },
  });
  revalidatePath(`/teacher/classes/${classId}`);
}

// ============ المدرس يرجع طالب للفصل ============
export async function unblockStudent(classId: string, studentId: string) {
  const teacher = await requireRole("TEACHER");
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.id },
  });
  if (!cls) return;
  await prisma.enrollment.update({
    where: { classId_studentId: { classId, studentId } },
    data: { status: "ACTIVE" },
  });
  revalidatePath(`/teacher/classes/${classId}`);
}

// ============ المدرس يضيف حصة للجدول ============
export async function addSchedule(
  classId: string,
  state: ClassActionState,
  formData: FormData
): Promise<ClassActionState> {
  const teacher = await requireRole("TEACHER");
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.id },
  });
  if (!cls) return { message: "الفصل غير موجود" };

  const title = String(formData.get("title") || "").trim();
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = String(formData.get("startTime") || "");
  const durationMinutes = Number(formData.get("durationMinutes") || 60);

  const errors: Record<string, string[]> = {};
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)
    errors.dayOfWeek = ["اختر اليوم"];
  if (!DAY_REGEX.test(startTime)) errors.startTime = ["اكتب وقت صحيح HH:mm"];
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 600)
    errors.durationMinutes = ["المدة من 1 لـ 600 دقيقة"];

  if (Object.keys(errors).length > 0) return { errors };

  await prisma.sessionSchedule.create({
    data: {
      classId,
      title: title || null,
      dayOfWeek,
      startTime,
      durationMinutes,
    },
  });
  revalidatePath(`/teacher/classes/${classId}`);
  return { message: "تمت إضافة الحصة للجدول" };
}

// ============ المدرس يحذف حصة من الجدول ============
export async function removeSchedule(classId: string, scheduleId: string) {
  const teacher = await requireRole("TEACHER");
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.id },
  });
  if (!cls) return;
  // اربط الحذف بالفصل المملوك للمدرس حتى لا يمكن حذف موعد من فصل آخر.
  await prisma.sessionSchedule.deleteMany({
    where: { id: scheduleId, classId },
  });
  revalidatePath(`/teacher/classes/${classId}`);
}
