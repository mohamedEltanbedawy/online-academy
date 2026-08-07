import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, dayLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const student = await requireRole("STUDENT");
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id, status: "ACTIVE" },
    include: {
      class: {
        include: {
          teacher: { select: { name: true } },
          schedules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <AppShell
      title={`لوحة الطالب — أهلاً ${student.name}`}
      subtitle="فصولك وجداول حصصك من هنا."
      actions={
        <Link href="/join" className="btn-primary">
          + الانضمام لفصل بكود
        </Link>
      }
    >
      <div className="flex items-center justify-between">
        <h2 className="section-title">فصولك ({enrollments.length})</h2>
      </div>

      {enrollments.length === 0 ? (
        <div className="empty-state mt-4">
          لسه مشترك في أي فصل — اطلب كود الدعوة من مدرسك واضغط
          «الانضمام لفصل بكود».
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {enrollments.map((e) => (
            <Link
              key={e.id}
              href={`/student/classes/${e.class.id}`}
              className="card p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{e.class.name}</h3>
                {e.source === "PLATFORM" && (
                  <span className="badge badge-blue">من المنصة</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {e.class.subject} — مدرس: {e.class.teacher.name}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                سعر الحصة:{" "}
                <span className="font-bold text-blue-600">
                  {formatMoney(e.class.pricePerHour)} ج.م
                </span>
              </p>
              {e.class.schedules.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  {e.class.schedules.slice(0, 3).map((s) => (
                    <li key={s.id}>
                      {dayLabel(s.dayOfWeek)} — {s.startTime} ({s.durationMinutes} د)
                    </li>
                  ))}
                  {e.class.schedules.length > 3 && (
                    <li>+ {e.class.schedules.length - 3} حصص أخرى</li>
                  )}
                </ul>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
