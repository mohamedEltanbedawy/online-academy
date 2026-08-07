import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, dayLabel } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { InviteCode } from "@/components/teacher/invite-code";
import { AddScheduleForm } from "@/components/teacher/add-schedule-form";
import {
  blockStudent,
  unblockStudent,
  removeSchedule,
} from "@/app/actions/classes";

export const dynamic = "force-dynamic";

const sourceLabels: Record<string, string> = {
  PLATFORM: "من المنصة",
  TEACHER: "مع المدرس",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "مشترك",
  BLOCKED: "ممنوع",
  LEFT: "ساب الفصل",
};

export default async function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireRole("TEACHER");
  const { id } = await params;

  const cls = await prisma.class.findFirst({
    where: { id, teacherId: teacher.id },
    include: {
      enrollments: {
        include: {
          student: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { joinedAt: "desc" },
      },
      schedules: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!cls) notFound();

  const activeCount = cls.enrollments.filter(
    (e) => e.status === "ACTIVE"
  ).length;

  return (
    <AppShell title={cls.name} subtitle={cls.subject}>
      <div className="space-y-6">
        <section className="section-card">
          <h2 className="section-title">نموذج الربح</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">سعر الحصة للطالب</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatMoney(cls.pricePerHour)} ج.م
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-slate-600">نسبة المنصة (طلبة الدعاية)</p>
              <p className="mt-1 text-xl font-bold text-blue-700">
                {formatMoney(cls.platformPercent)}٪
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-slate-600">كلفة المنصة (طلبة المدرس)</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {formatMoney(cls.fixedFee)} ج.م / حصة
              </p>
            </div>
          </div>
          {cls.description && (
            <p className="mt-3 text-sm text-slate-600">{cls.description}</p>
          )}
        </section>

        <div className="space-y-3">
          <Link
            href={`/teacher/classes/${cls.id}/room`}
            className="btn-primary w-full"
          >
            دخول قاعة الدرس المباشرة
          </Link>
          <Link
            href={`/teacher/classes/${cls.id}/homework`}
            className="btn-outline w-full"
          >
            إدارة واجبات الفصل
          </Link>
          <Link
            href={`/teacher/classes/${cls.id}/recordings`}
            className="btn-outline w-full"
          >
            مكتبة تسجيلات الفصل
          </Link>
        </div>

        <section className="section-card">
          <h2 className="section-title">كود دعوة الفصل</h2>
          <p className="mt-1 text-sm text-slate-600">
            ابعت الكود ده لطلبتك — اللي يكتبه في صفحة الانضمام يشترك في الفصل.
          </p>
          <div className="mt-3">
            <InviteCode code={cls.inviteCode} />
          </div>
        </section>

        <section className="section-card">
          <h2 className="section-title">جدول الحصص الأسبوعي</h2>
          {cls.schedules.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              لسه مفيش حصص في الجدول — ضيف أول حصة تحت.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {cls.schedules.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {s.title || "حصة"}{" "}
                      <span className="font-normal text-slate-500">
                        — {dayLabel(s.dayOfWeek)} الساعة {s.startTime}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">
                      المدة: {s.durationMinutes} دقيقة
                    </p>
                  </div>
                  <form action={removeSchedule.bind(null, cls.id, s.id)}>
                    <button
                      type="submit"
                      className="btn-danger-outline btn-sm"
                    >
                      حذف
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <AddScheduleForm classId={cls.id} />
          </div>
        </section>

        <section className="section-card">
          <div className="flex items-center justify-between">
            <h2 className="section-title">
              الطلبة ({activeCount} مشترك)
            </h2>
          </div>
          {cls.enrollments.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              لسه مفيش طلبة — ابعت كود الدعوة وعايزين يشتركوا.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {cls.enrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{e.student.name}</p>
                    <p className="text-sm text-slate-500" dir="ltr">
                      {e.student.phone} • {e.student.email}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      <span className="badge badge-slate">
                        {sourceLabels[e.source]}
                      </span>{" "}
                      <span
                        className={
                          e.status === "ACTIVE"
                            ? "badge badge-green"
                            : e.status === "BLOCKED"
                              ? "badge badge-red"
                              : "badge badge-slate"
                        }
                      >
                        {statusLabels[e.status]}
                      </span>
                    </p>
                  </div>
                  {e.status === "ACTIVE" ? (
                    <form action={blockStudent.bind(null, cls.id, e.studentId)}>
                      <button
                        type="submit"
                        className="btn-danger-outline btn-sm"
                      >
                        منع
                      </button>
                    </form>
                  ) : e.status === "BLOCKED" ? (
                    <form action={unblockStudent.bind(null, cls.id, e.studentId)}>
                      <button
                        type="submit"
                        className="btn-outline btn-sm"
                      >
                        إرجاع
                      </button>
                    </form>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
