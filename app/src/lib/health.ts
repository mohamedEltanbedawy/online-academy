import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import { getMyChildren } from "./family";

// طبقة بيانات الصحة (M3) — كل استعلامات الملف الصحي بتمر من هنا

// جلب كل بيانات طفل (للملف الصحي الكامل)
export const getChildHealth = cache(async (childId: string) => {
  const [child, growth, vaccinations, sleep, nutrition, medicines, documents] = await Promise.all([
    prisma.child.findUnique({ where: { id: childId } }),
    prisma.growthRecord.findMany({ where: { childId }, orderBy: { date: "desc" } }),
    prisma.vaccination.findMany({ where: { childId }, orderBy: { date: "desc" } }),
    prisma.sleepRecord.findMany({ where: { childId }, orderBy: { date: "desc" } }),
    prisma.nutritionRecord.findMany({ where: { childId }, orderBy: { date: "desc" } }),
    prisma.medicine.findMany({ where: { childId }, orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.healthDocument.findMany({ where: { childId }, orderBy: { createdAt: "desc" } }),
  ]);
  return { child, growth, vaccinations, sleep, nutrition, medicines, documents };
});

// هل الطفل ده من أولاد المستخدم الحالي؟ (للأهالي)
export const isChildOfMine = cache(async (childId: string) => {
  const children = await getMyChildren();
  return children.some((c) => c.id === childId);
});

// ملف صحي لأي طفل من أولادي (لصفحة العائلة)
export const getMyChildHealth = cache(async (childId: string) => {
  if (!(await isChildOfMine(childId))) return null;
  return getChildHealth(childId);
});
