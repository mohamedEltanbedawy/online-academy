"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AdminActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

const ALLOWED_ROLES = ["STUDENT", "TEACHER", "ADMIN", "CASHIER", "PARENT", "STAFF"] as const;

export async function createUser(state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "");
  const errors: Record<string, string[]> = {};
  if (name.length < 3) errors.name = ["الاسم قصير"];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = ["اكتب إيميل صحيح"];
  if (!/^01[0-9]{9}$/.test(phone)) errors.phone = ["رقم الموبايل يجب أن يكون 11 رقمًا ويبدأ بـ 01"];
  if (password.length < 8) errors.password = ["الباسورد 8 حروف على الأقل"];
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) errors.role = ["الدور غير صحيح"];
  if (Object.keys(errors).length > 0) return { errors };
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) return { message: "الإيميل أو رقم الموبايل مستخدم بالفعل" };
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { name, email, phone, passwordHash, role: role as (typeof ALLOWED_ROLES)[number] } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "CREATE_USER", entity: "User", entityId: created.id, details: { name, email, role } } });
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createClassAsAdmin(state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireRole("ADMIN");
  const teacherId = String(formData.get("teacherId") || "");
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const pricePerHour = Number(formData.get("pricePerHour"));
  const platformPercent = Number(formData.get("platformPercent") || 0);
  const fixedFee = Number(formData.get("fixedFee") || 0);
  const errors: Record<string, string[]> = {};
  if (!teacherId) errors.teacherId = ["اختر المدرس"];
  if (name.length < 2) errors.name = ["اسم الفصل قصير"];
  if (subject.length < 2) errors.subject = ["اكتب المادة"];
  if (!Number.isFinite(pricePerHour) || pricePerHour <= 0) errors.pricePerHour = ["السعر غير صحيح"];
  if (!Number.isFinite(platformPercent) || platformPercent < 0 || platformPercent > 100) errors.platformPercent = ["النسبة من 0 إلى 100"];
  if (!Number.isFinite(fixedFee) || fixedFee < 0) errors.fixedFee = ["الكلفة غير صحيحة"];
  if (Object.keys(errors).length > 0) return { errors };
  const teacher = await prisma.user.findFirst({ where: { id: teacherId, role: "TEACHER" } });
  if (!teacher) return { message: "المدرس غير موجود" };
  let inviteCode = generateInviteCode();
  while (await prisma.class.findUnique({ where: { inviteCode } })) inviteCode = generateInviteCode();
  await prisma.$transaction(async (tx) => {
    const cls = await tx.class.create({ data: { teacherId, name, subject, description: description || null, pricePerHour, platformPercent, fixedFee, inviteCode } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "CREATE_CLASS", entity: "Class", entityId: cls.id, details: { name, teacherId } } });
  });
  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function toggleUserActive(userId: string) {
  const admin = await requireRole("ADMIN");
  if (userId === admin.id) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, active: true, email: true } });
  if (!user) return;
  const active = !user.active;
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { active } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: active ? "ACTIVATE_USER" : "DEACTIVATE_USER", entity: "User", entityId: user.id, details: { email: user.email } } }),
  ]);
  revalidatePath("/admin/users");
}

export async function setClassArchived(classId: string, archived: boolean) {
  const admin = await requireRole("ADMIN");
  const cls = await prisma.class.findUnique({ where: { id: classId }, select: { id: true, name: true } });
  if (!cls) return;
  await prisma.$transaction([
    prisma.class.update({ where: { id: classId }, data: { status: archived ? "ARCHIVED" : "ACTIVE" } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: archived ? "ARCHIVE_CLASS" : "RESTORE_CLASS", entity: "Class", entityId: cls.id, details: { name: cls.name } } }),
  ]);
  revalidatePath("/admin/classes");
  revalidatePath("/admin");
}

export async function updateClass(state: { errors?: Record<string, string[]>; message?: string } | undefined, formData: FormData) {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const pricePerHour = Number(formData.get("pricePerHour"));
  const platformPercent = Number(formData.get("platformPercent"));
  const fixedFee = Number(formData.get("fixedFee"));
  const errors: Record<string, string[]> = {};
  if (name.length < 2) errors.name = ["اسم الفصل قصير"];
  if (subject.length < 2) errors.subject = ["اكتب المادة"];
  if (!Number.isFinite(pricePerHour) || pricePerHour <= 0) errors.pricePerHour = ["السعر غير صحيح"];
  if (!Number.isFinite(platformPercent) || platformPercent < 0 || platformPercent > 100) errors.platformPercent = ["النسبة من 0 إلى 100"];
  if (!Number.isFinite(fixedFee) || fixedFee < 0) errors.fixedFee = ["الكلفة غير صحيحة"];
  if (Object.keys(errors).length) return { errors };
  await prisma.$transaction([
    prisma.class.update({ where: { id }, data: { name, subject, description: description || null, pricePerHour, platformPercent, fixedFee } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_CLASS", entity: "Class", entityId: id } }),
  ]);
  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function updateUser(state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "");
  if (name.length < 3) return { errors: { name: ["الاسم قصير"] } };
  if (!/^[0-9]{11}$/.test(phone)) return { errors: { phone: ["رقم الموبايل يجب أن يكون 11 رقمًا"] } };
  if (!["STUDENT", "TEACHER", "ADMIN", "CASHIER", "PARENT", "STAFF"].includes(role)) return { message: "الدور غير صحيح" };
  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { name, phone, role: role as "STUDENT" | "TEACHER" | "ADMIN" | "CASHIER" | "PARENT" | "STAFF" } }),
      prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_USER", entity: "User", entityId: id } }),
    ]);
  } catch { return { message: "الإيميل أو رقم الموبايل مستخدم بالفعل" }; }
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateHomework(state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim();
  const maxScore = Number(formData.get("maxScore"));
  const dueValue = String(formData.get("dueAt") || "");
  const dueAt = dueValue ? new Date(dueValue) : null;
  if (title.length < 3 || instructions.length < 3) return { message: "العنوان والتعليمات مطلوبان" };
  if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 1000) return { message: "الدرجة غير صحيحة" };
  await prisma.$transaction([
    prisma.homework.update({ where: { id }, data: { title, instructions, maxScore, dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_HOMEWORK", entity: "Homework", entityId: id } }),
  ]);
  revalidatePath("/admin/homework");
  redirect("/admin/homework");
}

export async function toggleHomeworkActive(homeworkId: string) {
  const admin = await requireRole("ADMIN");
  const homework = await prisma.homework.findUnique({ where: { id: homeworkId }, select: { active: true } });
  if (!homework) return;
  await prisma.$transaction([
    prisma.homework.update({ where: { id: homeworkId }, data: { active: !homework.active } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: homework.active ? "DEACTIVATE_HOMEWORK" : "ACTIVATE_HOMEWORK", entity: "Homework", entityId: homeworkId } }),
  ]);
  revalidatePath("/admin/homework");
}

export async function updateRecordingTitle(state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (title.length < 2) return { message: "اسم التسجيل قصير" };
  await prisma.$transaction([
    prisma.recording.update({ where: { id }, data: { title } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_RECORDING", entity: "Recording", entityId: id } }),
  ]);
  revalidatePath("/admin/recordings");
  redirect("/admin/recordings");
}

export async function renameRecording(formData: FormData) {
  await updateRecordingTitle(undefined, formData);
}

export async function toggleRecordingActive(recordingId: string) {
  const admin = await requireRole("ADMIN");
  const recording = await prisma.recording.findUnique({ where: { id: recordingId }, select: { active: true, title: true } });
  if (!recording) return;
  await prisma.$transaction([
    prisma.recording.update({ where: { id: recordingId }, data: { active: !recording.active } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: recording.active ? "HIDE_RECORDING" : "SHOW_RECORDING", entity: "Recording", entityId: recordingId, details: { title: recording.title } } }),
  ]);
  revalidatePath("/admin/recordings");
}

export async function generatePayouts() {
  const admin = await requireRole("ADMIN");
  const payments = await prisma.payment.findMany({
    where: { status: "PAID", payout: null, classId: { not: null }, studentId: { not: null } },
    include: { class: { include: { enrollments: true } } },
  });
  let created = 0;
  await prisma.$transaction(async (tx) => {
    for (const payment of payments) {
      if (!payment.classId || !payment.studentId || !payment.class) continue;
      const enrollment = payment.class.enrollments.find((item) => item.studentId === payment.studentId);
      if (!enrollment) continue;
      const platformFee = enrollment.source === "PLATFORM"
        ? payment.amount.mul(payment.class.platformPercent).div(100)
        : payment.class.fixedFee;
      const teacherAmount = payment.amount.sub(platformFee).lt(0) ? new Prisma.Decimal(0) : payment.amount.sub(platformFee);
      await tx.payout.create({ data: { paymentId: payment.id, teacherId: payment.class.teacherId, grossAmount: payment.amount, platformFee, teacherAmount } });
      created++;
    }
    await tx.auditLog.create({ data: { actorId: admin.id, action: "GENERATE_PAYOUTS", entity: "Payout", entityId: "batch", details: { created } } });
  });
  redirect(`/admin/payouts?created=${created}`);
}

export async function markPayoutPaid(payoutId: string) {
  const admin = await requireRole("ADMIN");
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) return;
  await prisma.$transaction([
    prisma.payout.update({ where: { id: payoutId }, data: { status: "PAID", paidAt: new Date() } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "MARK_PAYOUT_PAID", entity: "Payout", entityId: payoutId } }),
  ]);
  revalidatePath("/admin/payouts");
}
