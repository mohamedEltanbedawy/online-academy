import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";
import { getCurrentTenant } from "./tenant";

// طبقة بيانات الأسرة (Family OS) — كل استعلامات صفحات /family بتمر من هنا

// عائلات المستخدم الحالي مع كامل الأعضاء
export const getMyFamilyMemberships = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return [];
  const person = await prisma.person.findUnique({ where: { userId: user.id } });
  if (!person) return [];
  return prisma.familyMember.findMany({
    where: { personId: person.id },
    include: {
      family: {
        include: {
          headPerson: { select: { id: true, fullName: true } },
          members: {
            include: {
              person: {
                select: { id: true, fullName: true, birthDate: true, gender: true, avatarUrl: true, externalKey: true },
              },
            },
          },
        },
      },
    },
  });
});

// معرّف المستأجر الحالي
export const getMyTenantId = cache(async () => {
  const tenant = await getCurrentTenant();
  return tenant?.id ?? "";
});

// الأولاد (الأطفال) التابعين للعائلة → سجلات Child الأصلية
export const getMyChildren = cache(async () => {
  const memberships = await getMyFamilyMemberships();
  const childKeys = new Set<string>();
  for (const m of memberships) {
    for (const member of m.family.members) {
      if (member.person.externalKey?.startsWith("child:")) {
        childKeys.add(member.person.externalKey);
      }
    }
  }
  if (childKeys.size === 0) return [];
  const childIds = [...childKeys].map((k) => k.replace("child:", ""));
  return prisma.child.findMany({ where: { id: { in: childIds } }, orderBy: { birthDate: "desc" } });
});

// ملخص التعليم لأبناء العائلة (ربط التعليم بالعائلة)
export const getChildrenEducationSummary = cache(async () => {
  const children = await getMyChildren();
  if (children.length === 0) return [];
  const ids = children.map((c) => c.id);
  const [subscriptions, assessments, activityEnrollments, programs, invoices] = await Promise.all([
    prisma.nurserySubscription.findMany({ where: { childId: { in: ids } }, select: { childId: true, planName: true, status: true } }),
    prisma.childAssessment.findMany({ where: { childId: { in: ids } }, select: { childId: true, score: true } }),
    prisma.activityEnrollment.findMany({ where: { childId: { in: ids } }, select: { childId: true, status: true } }),
    prisma.childProgram.findMany({ where: { childId: { in: ids } }, select: { childId: true, active: true } }),
    prisma.nurseryInvoice.findMany({ where: { childId: { in: ids } }, select: { childId: true, status: true } }),
  ]);
  return children.map((child) => ({
    child,
    subscription: subscriptions.find((s) => s.childId === child.id),
    assessmentsCount: assessments.filter((a) => a.childId === child.id).length,
    lastAssessment: assessments.filter((a) => a.childId === child.id).sort((a, b) => b.score - a.score)[0],
    activitiesCount: activityEnrollments.filter((a) => a.childId === child.id).length,
    programsCount: programs.filter((p) => p.childId === child.id && p.active).length,
    invoices: invoices.filter((i) => i.childId === child.id),
  }));
});

// أحداث العائلة في فترة معينة
export const getFamilyEvents = cache(async (from: Date, to: Date) => {
  const tenantId = await getMyTenantId();
  return prisma.familyEvent.findMany({
    where: { tenantId, startsAt: { gte: from, lte: to } },
    orderBy: { startsAt: "asc" },
  });
});

// خطة يوم معين
export const getPlanItemsForDay = cache(async (day: Date) => {
  const tenantId = await getMyTenantId();
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return prisma.planItem.findMany({
    where: { tenantId, day: { gte: start, lt: end } },
    include: { assignedTo: { select: { id: true, fullName: true } } },
    orderBy: [{ done: "asc" }, { time: "asc" }],
  });
});

// الأعضاء القابلين للاختيار في الخطة (كل أفراد عائلات المستخدم)
export const getFamilyPersons = cache(async () => {
  const memberships = await getMyFamilyMemberships();
  const persons = new Map<string, { id: string; fullName: string }>();
  for (const m of memberships) {
    for (const member of m.family.members) {
      persons.set(member.person.id, { id: member.person.id, fullName: member.person.fullName });
    }
  }
  return [...persons.values()];
});
