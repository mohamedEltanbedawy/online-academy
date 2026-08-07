import { notFound } from "next/navigation";
import { GradeSubmissionForm } from "@/components/teacher/grade-submission-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function TeacherHomeworkDetailPage({ params }: { params: Promise<{ id: string; homeworkId: string }> }) {
  const teacher = await requireRole("TEACHER");
  const { id, homeworkId } = await params;
  const homework = await prisma.homework.findFirst({
    where: { id: homeworkId, classId: id, class: { teacherId: teacher.id } },
    include: {
      class: { select: { name: true } },
      submissions: {
        include: { student: { select: { name: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!homework) notFound();
  return (
    <AppShell title={homework.title} subtitle={homework.class.name}>
      <section className="section-card">
        <h2 className="section-title">التعليمات</h2>
        <p className="mt-2 whitespace-pre-wrap text-slate-700">{homework.instructions}</p>
        <p className="mt-3 text-sm text-slate-500">
          الدرجة النهائية: {homework.maxScore}
          {homework.dueAt ? ` • موعد التسليم: ${homework.dueAt.toLocaleString("ar-EG")}` : ""}
        </p>
      </section>
      <section className="mt-6 space-y-4">
        <h2 className="section-title">حلول الطلبة ({homework.submissions.length})</h2>
        {homework.submissions.length === 0 ? (
          <div className="empty-state">لم يتم تسليم حلول بعد.</div>
        ) : (
          homework.submissions.map((submission) => (
            <article key={submission.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{submission.student.name}</h3>
                  <p className="text-sm text-slate-500">
                    {submission.student.email} • {submission.submittedAt.toLocaleString("ar-EG")}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-600">
                  {submission.status === "GRADED" ? `تم التصحيح: ${submission.score}/${homework.maxScore}` : "ينتظر التصحيح"}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-slate-700">{submission.answer}</p>
              <GradeSubmissionForm
                submissionId={submission.id}
                maxScore={homework.maxScore}
                score={submission.score}
                feedback={submission.feedback ?? ""}
              />
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}
