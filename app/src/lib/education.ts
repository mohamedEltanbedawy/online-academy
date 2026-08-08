import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import { getMyChildren } from "./family";
import { getCurrentUser } from "./auth";
import { getMyTenantId } from "./family";

export const getChildSubjects = cache(async (childId: string) => {
  return prisma.subject.findMany({
    where: { childId, active: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
});

export const getChildLessons = cache(async (childId: string, limit = 50) => {
  return prisma.tutoringLesson.findMany({
    where: { childId },
    include: { subject: { select: { id: true, name: true, type: true } }, homework: true },
    orderBy: { date: "desc" },
    take: limit,
  });
});

export const getLessonById = cache(async (id: string) => {
  return prisma.tutoringLesson.findUnique({
    where: { id },
    include: { subject: true, homework: true },
  });
});

export const getChildTimetable = cache(async (childId: string) => {
  return prisma.weeklySchedule.findMany({
    where: { childId },
    include: { subject: { select: { id: true, name: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
});

export const getChildPendingHomework = cache(async (childId: string) => {
  return prisma.lessonHomework.findMany({
    where: {
      lesson: { childId },
      status: "PENDING",
    },
    include: {
      lesson: {
        select: { id: true, content: true, date: true, subject: { select: { name: true } } },
      },
    },
    orderBy: { dueDate: "asc" },
  });
});

export const isMyChild = cache(async (childId: string) => {
  const children = await getMyChildren();
  if (children.some((c) => c.id === childId)) return true;
  // also check ChildGuardian for guardian relationship
  const user = await getCurrentUser();
  if (!user) return false;
  const link = await prisma.childGuardian.findUnique({ where: { childId_guardianId: { childId, guardianId: user.id } } });
  return link !== null;
});

// للطفل الذي عنده حساب طالب: إيجاد سجل Child المرتبط بحسابه
export const getMyChild = cache(async () => {
  const user = await getCurrentUser();
  if (!user || (user.role !== "STUDENT" && user.role !== "PARENT")) return null;
  const person = await prisma.person.findUnique({ where: { userId: user.id } });
  if (!person?.externalKey?.startsWith("child:")) return null;
  const childId = person.externalKey.slice(6);
  return prisma.child.findUnique({ where: { id: childId } });
});
