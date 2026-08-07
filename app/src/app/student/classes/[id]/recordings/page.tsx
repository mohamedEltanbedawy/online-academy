import { AppShell } from "@/components/app-shell";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentRecordingsPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await requireRole("STUDENT");
  const { id } = await params;
  const enrollment = await prisma.enrollment.findFirst({ where: { classId: id, studentId: student.id, status: "ACTIVE" }, include: { class: { include: { recordings: { where: { status: "STOPPED", active: true }, orderBy: { startedAt: "desc" } } } } } });
  if (!enrollment) notFound();
  return (
    <AppShell
      title={`مكتبة ${enrollment.class.name}`}
      subtitle="الحصص المسجلة المتاحة لك."
    >
      {enrollment.class.recordings.length === 0 ? (
        <div className="empty-state">لا توجد حصص مسجلة بعد.</div>
      ) : (
        <div className="space-y-4">
          {enrollment.class.recordings.map((recording) => (
            <article key={recording.id} className="card p-5">
              <h2 className="font-bold text-slate-900">{recording.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{recording.startedAt.toLocaleString("ar-EG")} • {recording.durationSeconds ?? 0} ثانية</p>
              <video controls preload="metadata" src={`/api/recordings/${recording.id}`} className="mt-4 w-full rounded-xl bg-black" />
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
