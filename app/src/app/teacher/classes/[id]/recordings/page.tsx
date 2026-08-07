import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function TeacherRecordingsPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireRole("TEACHER");
  const { id } = await params;
  const cls = await prisma.class.findFirst({
    where: { id, teacherId: teacher.id },
    include: { recordings: { orderBy: { startedAt: "desc" } } },
  });
  if (!cls) notFound();
  return (
    <AppShell
      title={`تسجيلات ${cls.name}`}
      subtitle="التسجيل يبدأ من داخل قاعة الدرس."
    >
      {cls.recordings.length === 0 ? (
        <div className="empty-state">لا توجد تسجيلات بعد.</div>
      ) : (
        <div className="space-y-4">
          {cls.recordings.map((recording) => (
            <article key={recording.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{recording.title}</h2>
                  <p className="text-sm text-slate-500">{recording.startedAt.toLocaleString("ar-EG")}</p>
                </div>
                {recording.status === "STOPPED" ? (
                  <span className="badge badge-slate">{recording.durationSeconds ?? 0} ثانية</span>
                ) : (
                  <span className="badge badge-amber">قيد التسجيل</span>
                )}
              </div>
              {recording.status === "STOPPED" && (
                <video
                  controls
                  preload="metadata"
                  src={`/api/recordings/${recording.id}`}
                  className="mt-4 w-full rounded-xl bg-black"
                />
              )}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
