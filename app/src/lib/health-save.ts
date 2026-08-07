import "server-only";
import { prisma } from "./prisma";

// منطق حفظ البيانات الصحية المستخرجة — يُستخدم من لوحة الإدارة ومن بوت تيليجرام
// (التحقق من الصلاحية يتم قبل الاستدعاء في كل جهة)

export interface ParsedHealth {
  growth: { date: string; weightKg?: number | null; heightCm?: number | null; headCm?: number | null; notes?: string | null }[];
  vaccinations: { name: string; dose?: string | null; date: string; nextDueDate?: string | null; notes?: string | null }[];
  sleep: { date: string; hours?: number | null; quality?: string | null; notes?: string | null }[];
  nutrition: { date: string; meal?: string | null; foods: string; notes?: string | null }[];
  medicines: { name: string; dosage?: string | null; frequency?: string | null; startDate?: string | null; endDate?: string | null; notes?: string | null }[];
}

// حفظ البيانات المؤكدة في الملف الصحي
export async function saveParsedHealthData(tenantId: string, childId: string, data: ParsedHealth) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) return { ok: false as const, error: "الطفل غير موجود" };

  const counts = { growth: 0, vaccinations: 0, sleep: 0, nutrition: 0, medicines: 0 };
  const toDate = (v?: string | null) => (v ? new Date(`${v}T00:00:00`) : null);

  for (const g of data.growth ?? []) {
    if (!g.date) continue;
    await prisma.growthRecord.create({
      data: { tenantId, childId, date: toDate(g.date)!, weightKg: g.weightKg ?? null, heightCm: g.heightCm ?? null, headCm: g.headCm ?? null, notes: g.notes || null },
    });
    counts.growth++;
  }
  for (const v of data.vaccinations ?? []) {
    if (!v.name || !v.date) continue;
    await prisma.vaccination.create({
      data: { tenantId, childId, name: v.name, dose: v.dose || null, date: toDate(v.date)!, nextDueDate: toDate(v.nextDueDate), notes: v.notes || null },
    });
    counts.vaccinations++;
  }
  for (const s of data.sleep ?? []) {
    if (!s.date) continue;
    await prisma.sleepRecord.create({
      data: { tenantId, childId, date: toDate(s.date)!, hours: s.hours ?? null, quality: s.quality || null, notes: s.notes || null },
    });
    counts.sleep++;
  }
  for (const n of data.nutrition ?? []) {
    if (!n.foods) continue;
    await prisma.nutritionRecord.create({
      data: { tenantId, childId, date: toDate(n.date) ?? new Date(), meal: n.meal || null, foods: n.foods, notes: n.notes || null },
    });
    counts.nutrition++;
  }
  for (const m of data.medicines ?? []) {
    if (!m.name) continue;
    await prisma.medicine.create({
      data: { tenantId, childId, name: m.name, dosage: m.dosage || null, frequency: m.frequency || null, startDate: toDate(m.startDate), endDate: toDate(m.endDate), notes: m.notes || null },
    });
    counts.medicines++;
  }

  return { ok: true as const, counts };
}

// أولاد المستخدم (ولي أمر/أخصائي) — يستخدمهم البوت للحفظ تلقائيًا
export async function getGuardianChildren(userId: string) {
  return prisma.child.findMany({
    where: { guardians: { some: { guardianId: userId } } },
    orderBy: { createdAt: "asc" },
  });
}
