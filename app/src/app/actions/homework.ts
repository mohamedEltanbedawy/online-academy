"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type HomeworkActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function createHomework(
  state: HomeworkActionState,
  formData: FormData
): Promise<HomeworkActionState> {
  const teacher = await requireRole("TEACHER");
  const classId = String(formData.get("classId") || "");
  const title = String(formData.get("title") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim();
  const dueAtValue = String(formData.get("dueAt") || "").trim();
  const maxScore = Number(formData.get("maxScore") || 100);

  const cls = await prisma.class.findFirst({ where: { id: classId, teacherId: teacher.id } });
  if (!cls) return { message: "الفصل غير موجود" };

  const errors: Record<string, string[]> = {};
  if (title.length < 3) errors.title = ["عنوان الواجب لازم يكون 3 حروف على الأقل"];
  if (instructions.length < 3) errors.instructions = ["اكتب تعليمات الواجب"];
  if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 1000)
    errors.maxScore = ["الدرجة من 1 لـ 1000"];

  let dueAt: Date | null = null;
  if (dueAtValue) {
    dueAt = new Date(dueAtValue);
    if (Number.isNaN(dueAt.getTime())) errors.dueAt = ["موعد التسليم غير صحيح"];
  }

  if (Object.keys(errors).length > 0) return { errors };

  const homework = await prisma.homework.create({
    data: { classId, title, instructions, dueAt, maxScore },
  });
  redirect(`/teacher/classes/${classId}/homework/${homework.id}`);
}

export async function submitHomework(
  homeworkId: string,
  state: HomeworkActionState,
  formData: FormData
): Promise<HomeworkActionState> {
  const student = await requireRole("STUDENT");
  const answer = String(formData.get("answer") || "").trim();

  if (answer.length < 2) return { errors: { answer: ["اكتب الحل قبل التسليم"] } };

  const homework = await prisma.homework.findFirst({
    where: {
      id: homeworkId,
      class: { enrollments: { some: { studentId: student.id, status: "ACTIVE" } } },
    },
    include: { submissions: { where: { studentId: student.id } } },
  });
  if (!homework) return { message: "الواجب غير موجود أو مشتركك غير فعال" };

  const existing = homework.submissions[0];
  if (existing?.status === "GRADED") {
    return { message: "الواجب اتصحح بالفعل ولا يمكن تغييره" };
  }

  await prisma.submission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId: student.id } },
    update: { answer, status: "SUBMITTED", submittedAt: new Date() },
    create: { homeworkId, studentId: student.id, answer },
  });

  redirect(`/student/classes/${homework.classId}/homework/${homeworkId}`);
}

export async function gradeSubmission(
  submissionId: string,
  state: HomeworkActionState,
  formData: FormData
): Promise<HomeworkActionState> {
  const teacher = await requireRole("TEACHER");
  const score = Number(formData.get("score"));
  const feedback = String(formData.get("feedback") || "").trim();

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, homework: { class: { teacherId: teacher.id } } },
    include: { homework: true },
  });
  if (!submission) return { message: "الحل غير موجود" };

  const errors: Record<string, string[]> = {};
  if (!Number.isInteger(score) || score < 0 || score > submission.homework.maxScore) {
    errors.score = [`الدرجة من 0 لـ ${submission.homework.maxScore}`];
  }
  if (Object.keys(errors).length > 0) return { errors };

  await prisma.submission.update({
    where: { id: submissionId },
    data: { score, feedback: feedback || null, status: "GRADED", gradedAt: new Date() },
  });

  redirect(`/teacher/classes/${submission.homework.classId}/homework/${submission.homeworkId}`);
}
