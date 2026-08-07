"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { getMyTenantId } from "@/lib/family";

export type HealthActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

const toDate = (raw: string): Date | null => {
  if (!raw) return null;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

// من يملك صلاحية إدخال الصحة؟ (STAFF/ADMIN بالصلاحية)
async function healthManager() {
  const user = await requirePermission("health:manage");
  const tenantId = await getMyTenantId();
  return { user, tenantId };
}

// ============ النمو (وزن/طول) ============
export async function createGrowthRecord(state: HealthActionState, formData: FormData): Promise<HealthActionState> {
  const { tenantId } = await healthManager();
  const childId = String(formData.get("childId") || "");
  const date = toDate(String(formData.get("date") || ""));
  const weightKg = Number(String(formData.get("weightKg") || ""));
  const heightCm = Number(String(formData.get("heightCm") || ""));
  const headCm = Number(String(formData.get("headCm") || ""));
  const notes = String(formData.get("notes") || "").trim();
  const errors: Record<string, string[]> = {};
  if (!date) errors.date = ["اختر التاريخ"];
  if (!weightKg && !heightCm && !headCm) errors.weightKg = ["أدخل وزن أو طول أو محيط رأس على الأقل"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.growthRecord.create({
    data: {
      tenantId,
      childId,
      date: date!,
      weightKg: weightKg ? weightKg : null,
      heightCm: heightCm ? heightCm : null,
      headCm: headCm ? headCm : null,
      notes: notes || null,
    },
  });
  revalidatePath(`/admin/children/${childId}/health`);
  revalidatePath(`/family/health`);
  return { message: "تم إضافة قياس النمو." };
}

export async function deleteGrowthRecord(recordId: string) {
  const { tenantId } = await healthManager();
  const rec = await prisma.growthRecord.findUnique({ where: { id: recordId } });
  if (!rec || rec.tenantId !== tenantId) return;
  await prisma.growthRecord.delete({ where: { id: recordId } });
  revalidatePath(`/admin/children/${rec.childId}/health`);
}

// ============ التطعيمات ============
export async function createVaccination(state: HealthActionState, formData: FormData): Promise<HealthActionState> {
  const { tenantId } = await healthManager();
  const childId = String(formData.get("childId") || "");
  const name = String(formData.get("name") || "").trim();
  const dose = String(formData.get("dose") || "").trim();
  const date = toDate(String(formData.get("date") || ""));
  const nextDueDate = toDate(String(formData.get("nextDueDate") || ""));
  const notes = String(formData.get("notes") || "").trim();
  const errors: Record<string, string[]> = {};
  if (name.length < 2) errors.name = ["اكتب اسم التطعيم"];
  if (!date) errors.date = ["اختر تاريخ التطعيم"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.vaccination.create({
    data: {
      tenantId,
      childId,
      name,
      dose: dose || null,
      date: date!,
      nextDueDate,
      notes: notes || null,
    },
  });
  revalidatePath(`/admin/children/${childId}/health`);
  revalidatePath(`/family/health`);
  return { message: "تم إضافة التطعيم." };
}

export async function deleteVaccination(recordId: string) {
  const { tenantId } = await healthManager();
  const rec = await prisma.vaccination.findUnique({ where: { id: recordId } });
  if (!rec || rec.tenantId !== tenantId) return;
  await prisma.vaccination.delete({ where: { id: recordId } });
  revalidatePath(`/admin/children/${rec.childId}/health`);
}

// ============ النوم ============
export async function createSleepRecord(state: HealthActionState, formData: FormData): Promise<HealthActionState> {
  const { tenantId } = await healthManager();
  const childId = String(formData.get("childId") || "");
  const date = toDate(String(formData.get("date") || ""));
  const hours = Number(String(formData.get("hours") || ""));
  const quality = String(formData.get("quality") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const errors: Record<string, string[]> = {};
  if (!date) errors.date = ["اختر التاريخ"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.sleepRecord.create({
    data: {
      tenantId,
      childId,
      date: date!,
      hours: hours ? hours : null,
      quality: quality || null,
      notes: notes || null,
    },
  });
  revalidatePath(`/admin/children/${childId}/health`);
  revalidatePath(`/family/health`);
  return { message: "تم إضافة سجل النوم." };
}

export async function deleteSleepRecord(recordId: string) {
  const { tenantId } = await healthManager();
  const rec = await prisma.sleepRecord.findUnique({ where: { id: recordId } });
  if (!rec || rec.tenantId !== tenantId) return;
  await prisma.sleepRecord.delete({ where: { id: recordId } });
  revalidatePath(`/admin/children/${rec.childId}/health`);
}

// ============ الغذاء ============
export async function createNutritionRecord(state: HealthActionState, formData: FormData): Promise<HealthActionState> {
  const { tenantId } = await healthManager();
  const childId = String(formData.get("childId") || "");
  const date = toDate(String(formData.get("date") || ""));
  const meal = String(formData.get("meal") || "").trim();
  const foods = String(formData.get("foods") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const errors: Record<string, string[]> = {};
  if (!date) errors.date = ["اختر التاريخ"];
  if (foods.length < 2) errors.foods = ["اكتب الأطعمة المتناولة"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.nutritionRecord.create({
    data: { tenantId, childId, date: date!, meal: meal || null, foods, notes: notes || null },
  });
  revalidatePath(`/admin/children/${childId}/health`);
  revalidatePath(`/family/health`);
  return { message: "تم إضافة سجل الغذاء." };
}

export async function deleteNutritionRecord(recordId: string) {
  const { tenantId } = await healthManager();
  const rec = await prisma.nutritionRecord.findUnique({ where: { id: recordId } });
  if (!rec || rec.tenantId !== tenantId) return;
  await prisma.nutritionRecord.delete({ where: { id: recordId } });
  revalidatePath(`/admin/children/${rec.childId}/health`);
}

// ============ الأدوية ============
export async function createMedicine(state: HealthActionState, formData: FormData): Promise<HealthActionState> {
  const { tenantId } = await healthManager();
  const childId = String(formData.get("childId") || "");
  const name = String(formData.get("name") || "").trim();
  const dosage = String(formData.get("dosage") || "").trim();
  const frequency = String(formData.get("frequency") || "").trim();
  const startDate = toDate(String(formData.get("startDate") || ""));
  const endDate = toDate(String(formData.get("endDate") || ""));
  const notes = String(formData.get("notes") || "").trim();
  const errors: Record<string, string[]> = {};
  if (name.length < 2) errors.name = ["اكتب اسم الدواء"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.medicine.create({
    data: {
      tenantId,
      childId,
      name,
      dosage: dosage || null,
      frequency: frequency || null,
      startDate,
      endDate,
      notes: notes || null,
    },
  });
  revalidatePath(`/admin/children/${childId}/health`);
  revalidatePath(`/family/health`);
  return { message: "تم إضافة الدواء." };
}

export async function toggleMedicineActive(medicineId: string) {
  const { tenantId } = await healthManager();
  const med = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!med || med.tenantId !== tenantId) return;
  await prisma.medicine.update({ where: { id: medicineId }, data: { active: !med.active } });
  revalidatePath(`/admin/children/${med.childId}/health`);
  revalidatePath(`/family/health`);
}

export async function deleteMedicine(medicineId: string) {
  const { tenantId } = await healthManager();
  const med = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!med || med.tenantId !== tenantId) return;
  await prisma.medicine.delete({ where: { id: medicineId } });
  revalidatePath(`/admin/children/${med.childId}/health`);
}

// ============ الملفات ============
export async function deleteHealthDocument(docId: string) {
  const { tenantId } = await healthManager();
  const doc = await prisma.healthDocument.findUnique({ where: { id: docId } });
  if (!doc || doc.tenantId !== tenantId) return;
  await prisma.healthDocument.delete({ where: { id: docId } });
  revalidatePath(`/admin/children/${doc.childId}/health`);
}

export async function backToChildHealth(childId: string) {
  redirect(`/admin/children/${childId}/health`);
}
