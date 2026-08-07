"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/auth";
import { getMyTenantId } from "@/lib/family";

export type AiActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

const PROVIDERS = ["GEMINI", "OPENAI", "OLLAMA"];

// إضافة/تعديل موديل AI من لوحة الإدارة
export async function saveAiProvider(state: AiActionState, formData: FormData): Promise<AiActionState> {
  await requireRole("ADMIN");
  const tenantId = await getMyTenantId();

  const id = String(formData.get("id") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  const provider = String(formData.get("provider") || "").trim();
  const modelName = String(formData.get("modelName") || "").trim();
  const baseUrl = String(formData.get("baseUrl") || "").trim() || null;
  const apiKey = String(formData.get("apiKey") || "").trim() || null;
  const supportsVision = formData.get("supportsVision") === "on";
  const enabled = formData.get("enabled") === "on";
  const isDefault = formData.get("isDefault") === "on";
  const temperatureRaw = String(formData.get("temperature") || "");
  const maxTokensRaw = String(formData.get("maxTokens") || "");

  const errors: Record<string, string[]> = {};
  if (name.length < 2) errors.name = ["اكتب اسم الموديل"];
  if (!PROVIDERS.includes(provider)) errors.provider = ["نوع المزود غير صحيح"];
  if (modelName.length < 2) errors.modelName = ["اكتب اسم الموديل التقني"];
  if (Object.keys(errors).length > 0) return { errors };

  const temperature = temperatureRaw ? Number(temperatureRaw) : null;
  const maxTokens = maxTokensRaw ? Number(maxTokensRaw) : null;
  const data = {
    tenantId,
    name,
    provider: provider as "GEMINI" | "OPENAI" | "OLLAMA",
    modelName,
    baseUrl,
    apiKey,
    supportsVision,
    enabled,
    temperature: temperature && !Number.isNaN(temperature) ? temperature : null,
    maxTokens: maxTokens && !Number.isNaN(maxTokens) ? maxTokens : null,
  };

  if (id) {
    await prisma.aiProvider.update({ where: { id }, data });
  } else {
    await prisma.aiProvider.create({ data });
  }

  // لو اتحدد افتراضي — ننزع الافتراضي من الباقيين
  if (isDefault) {
    await prisma.aiProvider.updateMany({ where: { tenantId, isDefault: true, NOT: { id: id ?? "__new__" } }, data: { isDefault: false } });
    await prisma.aiProvider.updateMany({ where: { id: id ?? "", tenantId }, data: { isDefault: true, enabled: true } });
  }

  revalidatePath("/admin/ai");
  redirect("/admin/ai");
}

// تفعيل/إيقاف موديل
export async function toggleAiProvider(providerId: string) {
  await requireRole("ADMIN");
  const provider = await prisma.aiProvider.findUnique({ where: { id: providerId } });
  if (!provider) return;
  await prisma.aiProvider.update({ where: { id: providerId }, data: { enabled: !provider.enabled } });
  revalidatePath("/admin/ai");
}

// جعل موديل هو الافتراضي
export async function setDefaultAiProvider(providerId: string) {
  await requireRole("ADMIN");
  const tenantId = await getMyTenantId();
  const provider = await prisma.aiProvider.findUnique({ where: { id: providerId } });
  if (!provider) return;
  await prisma.aiProvider.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
  await prisma.aiProvider.update({ where: { id: providerId }, data: { isDefault: true, enabled: true } });
  revalidatePath("/admin/ai");
}

// حذف موديل
export async function deleteAiProvider(providerId: string) {
  await requireRole("ADMIN");
  const provider = await prisma.aiProvider.findUnique({ where: { id: providerId } });
  if (!provider || provider.isDefault) return;
  await prisma.aiProvider.delete({ where: { id: providerId } });
  revalidatePath("/admin/ai");
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
