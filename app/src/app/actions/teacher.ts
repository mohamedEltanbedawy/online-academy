"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type TeacherActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

// ============ تكملة بيانات المدرس (المادة + الوصف + الأسعار الافتراضية) ============
export async function updateTeacherProfile(
  state: TeacherActionState,
  formData: FormData
): Promise<TeacherActionState> {
  const teacher = await requireRole("TEACHER");

  const subject = String(formData.get("subject") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") || 0);
  const defaultPlatformPercent = Number(formData.get("defaultPlatformPercent") || 0);
  const defaultFixedFee = Number(formData.get("defaultFixedFee") || 0);

  const errors: Record<string, string[]> = {};
  if (subject.length < 2) errors.subject = ["اكتب المادة الأساسية"];
  if (!Number.isFinite(defaultHourlyRate) || defaultHourlyRate < 0)
    errors.defaultHourlyRate = ["اكتب سعر صحيح"];
  if (
    !Number.isFinite(defaultPlatformPercent) ||
    defaultPlatformPercent < 0 ||
    defaultPlatformPercent > 100
  )
    errors.defaultPlatformPercent = ["النسبة من 0 لـ 100"];
  if (!Number.isFinite(defaultFixedFee) || defaultFixedFee < 0)
    errors.defaultFixedFee = ["اكتب كلفة صحيحة"];

  if (Object.keys(errors).length > 0) return { errors };

  await prisma.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: {
      subject,
      bio: bio || null,
      defaultHourlyRate,
      defaultPlatformPercent,
      defaultFixedFee,
    },
    create: {
      userId: teacher.id,
      subject,
      bio: bio || null,
      defaultHourlyRate,
      defaultPlatformPercent,
      defaultFixedFee,
    },
  });

  redirect("/teacher");
}
