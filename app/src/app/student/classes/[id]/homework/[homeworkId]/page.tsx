import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SubmitHomeworkForm } from "@/components/student/submit-homework-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentHomeworkDetailPage({ params }: { params: Promise<{ id: string; homeworkId: string }> }) {
  const student = await requireRole("STUDENT");
  const { id, homeworkId } = await params;
  const homework = await prisma.homework.findFirst({ where: { id: homeworkId, classId: id, class: { enrollments: { some: { studentId: student.id, status: "ACTIVE" } } } }, include: { class: { select: { name: true } }, submissions: { where: { studentId: student.id } } } });
  if (!homework) notFound();
  const submission = homework.submissions[0];
  const graded = submission?.status === "GRADED";
  return (
    <AppShell
      title={homework.title}
      subtitle={homework.class.name}
    >
      <div className="space-y-6">
        <section className="section-card">
          <h2 className="font-bold text-slate-900">التعليمات</h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">{homework.instructions}</p>
          <p className="mt-3 text-sm text-slate-500">الدرجة النهائية: {homework.maxScore}{homework.dueAt ? ` • موعد التسليم: ${homework.dueAt.toLocaleString("ar-EG")}` : ""}</p>
        </section>
        <section className="section-card">
          <h2 className="section-title">حلك</h2>
          <div className="mt-4">
            <SubmitHomeworkForm homeworkId={homework.id} initialAnswer={submission?.answer ?? ""} disabled={graded} />
          </div>
          {graded && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-4">
              <p className="font-bold text-emerald-800">الدرجة: {submission.score}/{homework.maxScore}</p>
              {submission.feedback && <p className="mt-1 text-sm text-emerald-700">تعليق المدرس: {submission.feedback}</p>}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
