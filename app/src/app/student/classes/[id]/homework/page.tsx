import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await requireRole("STUDENT");
  const { id } = await params;
  const enrollment = await prisma.enrollment.findFirst({ where: { classId: id, studentId: student.id, status: "ACTIVE" }, include: { class: { include: { homeworks: { include: { submissions: { where: { studentId: student.id }, select: { status: true, score: true } } }, orderBy: { createdAt: "desc" } } } } } });
  if (!enrollment) notFound();
  return (
    <AppShell
      title={`واجبات ${enrollment.class.name}`}
      subtitle="حل واجباتك وتابع درجاتك."
    >
      {enrollment.class.homeworks.length === 0 ? (
        <div className="empty-state">مفيش واجبات للفصل لحد دلوقتي.</div>
      ) : (
        <div className="space-y-3">
          {enrollment.class.homeworks.map((homework) => {
            const submission = homework.submissions[0];
            return (
              <Link key={homework.id} href={`/student/classes/${id}/homework/${homework.id}`} className="card block p-5 transition hover:shadow-md">
                <div className="flex justify-between gap-3">
                  <h2 className="font-bold text-slate-900">{homework.title}</h2>
                  <span className={`badge ${submission?.status === "GRADED" ? "badge-green" : submission ? "badge-amber" : "badge-slate"}`}>{submission?.status === "GRADED" ? `الدرجة ${submission.score}/${homework.maxScore}` : submission ? "تم التسليم" : "لم يتم الحل"}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{homework.instructions}</p>
                <p className="mt-3 text-xs text-slate-500">الدرجة: {homework.maxScore}{homework.dueAt ? ` • التسليم: ${homework.dueAt.toLocaleString("ar-EG")}` : ""}</p>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
