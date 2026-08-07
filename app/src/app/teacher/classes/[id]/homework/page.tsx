import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function TeacherHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireRole("TEACHER");
  const { id } = await params;
  const cls = await prisma.class.findFirst({
    where: { id, teacherId: teacher.id },
    include: {
      homeworks: {
        include: { _count: { select: { submissions: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!cls) notFound();

  return (
    <AppShell
      title={`واجبات ${cls.name}`}
      subtitle="أنشئ الواجبات وتابع حلول الطلبة."
      actions={
        <Link
          href={`/teacher/classes/${id}/homework/new`}
          className="btn-primary"
        >
          + إنشاء واجب جديد
        </Link>
      }
    >
      {cls.homeworks.length === 0 ? (
        <div className="empty-state">لسه مفيش واجبات.</div>
      ) : (
        <div className="space-y-3">
          {cls.homeworks.map((homework) => (
            <Link
              key={homework.id}
              href={`/teacher/classes/${id}/homework/${homework.id}`}
              className="card block p-5 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-slate-900">{homework.title}</h2>
                <span className="badge badge-slate">{homework._count.submissions} حل</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{homework.instructions}</p>
              <p className="mt-3 text-xs text-slate-500">
                الدرجة: {homework.maxScore}
                {homework.dueAt ? ` • التسليم: ${homework.dueAt.toLocaleString("ar-EG")}` : " • بدون موعد نهائي"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
