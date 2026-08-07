"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type ChildActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

function ageOnDate(birthDate: Date) {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const beforeBirthday = now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate());
  if (beforeBirthday) age--;
  return age;
}

export async function addChild(state: ChildActionState, formData: FormData): Promise<ChildActionState> {
  const parent = await requireRole("PARENT");
  const name = String(formData.get("name") || "").trim();
  const birthDateValue = String(formData.get("birthDate") || "");
  const stage = String(formData.get("stage") || "").trim();
  const schoolGrade = String(formData.get("schoolGrade") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const medicalNotes = String(formData.get("medicalNotes") || "").trim();
  const birthDate = new Date(birthDateValue);
  const errors: Record<string, string[]> = {};
  if (name.length < 3) errors.name = ["اكتب اسم الطفل كاملًا"];
  if (!birthDateValue || Number.isNaN(birthDate.getTime())) errors.birthDate = ["اختر تاريخ الميلاد"];
  else if (ageOnDate(birthDate) < 2 || ageOnDate(birthDate) > 14) errors.birthDate = ["البرنامج يبدأ من سن سنتين وحتى 14 سنة"];
  if (Object.keys(errors).length > 0) return { errors };

  await prisma.child.create({ data: { name, birthDate, stage: stage || null, schoolGrade: schoolGrade || null, notes: notes || null, medicalNotes: medicalNotes || null, guardians: { create: { guardianId: parent.id, primary: true } } } });
  redirect("/parent");
}

export async function createChildAsAdmin(state: ChildActionState, formData: FormData): Promise<ChildActionState> {
  const admin = await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const birthDateValue = String(formData.get("birthDate") || "");
  const guardianId = String(formData.get("guardianId") || "");
  const stage = String(formData.get("stage") || "").trim();
  const schoolGrade = String(formData.get("schoolGrade") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const medicalNotes = String(formData.get("medicalNotes") || "").trim();
  const birthDate = new Date(birthDateValue);
  const errors: Record<string, string[]> = {};
  if (name.length < 3) errors.name = ["اكتب اسم الطفل كاملًا"];
  if (!birthDateValue || Number.isNaN(birthDate.getTime())) errors.birthDate = ["اختر تاريخ الميلاد"];
  else if (ageOnDate(birthDate) < 2 || ageOnDate(birthDate) > 14) errors.birthDate = ["البرنامج يبدأ من سن سنتين وحتى 14 سنة"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.$transaction(async (tx) => {
    const child = await tx.child.create({ data: { name, birthDate, stage: stage || null, schoolGrade: schoolGrade || null, notes: notes || null, medicalNotes: medicalNotes || null } });
    if (guardianId) {
      await tx.childGuardian.create({ data: { childId: child.id, guardianId, primary: true } });
    }
    await tx.auditLog.create({ data: { actorId: admin.id, action: "CREATE_CHILD", entity: "Child", entityId: child.id, details: { name } } });
  });
  revalidatePath("/admin/children");
  redirect("/admin/children");
}
