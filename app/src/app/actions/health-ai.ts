"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { getMyTenantId } from "@/lib/family";
import { askJson, askVision } from "@/lib/ai";
import { saveParsedHealthData, type ParsedHealth } from "@/lib/health-save";

// إدخال صحي بالذكاء الاصطناعي: نص حر أو صورة → بيانات منظمة → معاينة → حفظ
// الموديل الافتراضي (من لوحة الإدارة) هو اللي بيشغّل التحويل

const SYSTEM_PROMPT = `أنت مساعد لملف صحي لطفل في روضة. حوّل النص/الصورة إلى بيانات صحية منظمة JSON فقط، بدون أي كلام إضافي.
التنسيق المطلوب (أو [] لو مفيش بيانات):
{
  "growth": [{ "date": "YYYY-MM-DD", "weightKg": عدد, "heightCm": عدد, "headCm": عدد|null, "notes": "نص|null" }],
  "vaccinations": [{ "name": "اسم", "dose": "نص|null", "date": "YYYY-MM-DD", "nextDueDate": "YYYY-MM-DD|null", "notes": "نص|null" }],
  "sleep": [{ "date": "YYYY-MM-DD", "hours": عدد, "quality": "نص|null", "notes": "نص|null" }],
  "nutrition": [{ "date": "YYYY-MM-DD", "meal": "فطار/غدا/عشا/سناك|null", "foods": "أطعمة", "notes": "نص|null" }],
  "medicines": [{ "name": "اسم", "dosage": "نص|null", "frequency": "نص|null", "startDate": "YYYY-MM-DD|null", "endDate": "YYYY-MM-DD|null", "notes": "نص|null" }]
}
لو التاريخ مش موجود استخدم اليوم. لو أرقام ناقصة سيبها null.`;

async function manager() {
  const user = await requirePermission("health:manage");
  const tenantId = await getMyTenantId();
  return { user, tenantId };
}

// تحويل نص حر إلى بيانات منظمة (بدون حفظ)
export async function parseHealthText(childId: string, text: string) {
  await manager();
  if (!childId) return { error: "اختر الطفل أولًا" };
  if (!text.trim()) return { error: "اكتب النص أو ارفع صورة أولًا" };
  try {
    const data = await askJson<ParsedHealth>(text, SYSTEM_PROMPT);
    return { data: normalize(data), model: (await getModelName()) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "فشل قراءة النص بالذكاء الاصطناعي" };
  }
}

// تحويل صورة (ورق/شهادة) إلى بيانات منظمة (بدون حفظ)
export async function parseHealthImage(childId: string, imageBase64: string, mimeType: string) {
  await manager();
  if (!childId) return { error: "اختر الطفل أولًا" };
  try {
    const raw = await askVision(`استخرج البيانات الصحية من هذه الصورة/الورقة. ${SYSTEM_PROMPT}`, imageBase64, mimeType);
    const data = await askJson<ParsedHealth>(raw, SYSTEM_PROMPT);
    return { data: normalize(data), model: (await getModelName()) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "فشل قراءة الصورة بالذكاء الاصطناعي" };
  }
}

// حفظ البيانات المؤكدة
export async function saveParsedHealth(childId: string, data: ParsedHealth) {
  const { tenantId } = await manager();
  const res = await saveParsedHealthData(tenantId, childId, data);
  if (!res.ok) return { error: res.error };
  revalidatePath(`/admin/children/${childId}/health`);
  revalidatePath(`/family/health`);
  return { ok: true, counts: res.counts };
}

async function getModelName() {
  const p = await prisma.aiProvider.findFirst({ where: { isDefault: true, enabled: true } });
  return p ? `${p.name} (${p.modelName})` : "غير معروف";
}

function normalize(d: Partial<ParsedHealth> | null): ParsedHealth {
  const empty: ParsedHealth = { growth: [], vaccinations: [], sleep: [], nutrition: [], medicines: [] };
  if (!d) return empty;
  return {
    growth: Array.isArray(d.growth) ? d.growth : [],
    vaccinations: Array.isArray(d.vaccinations) ? d.vaccinations : [],
    sleep: Array.isArray(d.sleep) ? d.sleep : [],
    nutrition: Array.isArray(d.nutrition) ? d.nutrition : [],
    medicines: Array.isArray(d.medicines) ? d.medicines : [],
  };
}
