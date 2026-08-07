import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, dayLabel } from "@/lib/format";
import { leaveClass } from "@/app/actions/classes";

export const dynamic = "force-dynamic";

export default async function StudentClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const student = await requireRole("STUDENT");
  const { id } = await params;

  const enrollment = await prisma.enrollment.findFirst({
    where: { classId: id, studentId: student.id },
    include: {
      class: {
        include: {
          teacher: { select: { name: true, phone: true } },
          schedules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        },
      },
    },
  });

  if (!enrollment || enrollment.status !== "ACTIVE") notFound();

  const cls = enrollment.class;

  return (
    <AppShell
      title={cls.name}
      subtitle={`${cls.subject} — مدرس: ${cls.teacher.name}`}
    >
      <div className="space-y-6">
        <section className="section-card">
          <h2 className="section-title">بيانات الفصل</h2>
          {cls.description && (
            <p className="mt-2 text-sm text-slate-600">{cls.description}</p>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">سعر الحصة</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatMoney(cls.pricePerHour)} ج.م
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">مدرس الفصل</p>
              <p className="mt-1 font-bold text-slate-900">
                {cls.teacher.name}
              </p>
              <p className="text-sm text-slate-500" dir="ltr">
                {cls.teacher.phone}
              </p>
            </div>
          </div>
        </section>

        <section className="section-card">
          <h2 className="section-title">جدول حصصك</h2>
          {cls.schedules.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              لسه مفيش جدول حصص للفصل ده — المدرس هيضيفه قريب.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {cls.schedules.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <p className="font-semibold text-slate-800">
                    {s.title || "حصة"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {dayLabel(s.dayOfWeek)} — الساعة {s.startTime} ({s.durationMinutes} دقيقة)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/student/classes/${cls.id}/room`}
            className="btn-primary"
          >
            دخول قاعة الدرس المباشرة
          </Link>
          <Link
            href={`/student/classes/${cls.id}/homework`}
            className="btn-outline"
          >
            واجبات الفصل
          </Link>
          <Link
            href={`/student/classes/${cls.id}/recordings`}
            className="btn-outline"
          >
            مكتبة الحصص المسجلة
          </Link>
          <Link
            href={`/student/classes/${cls.id}/payments/new`}
            className="btn-emerald"
          >
            الدفع الإلكتروني للفصل
          </Link>
        </div>

        <form
          action={leaveClass.bind(null, cls.id)}
          className="card border-red-100 bg-red-50 p-5 text-center"
        >
          <p className="text-sm text-red-700">
            مش حابب تكمل في الفصل؟ تقدر تسيبه في أي وقت.
          </p>
          <button type="submit" className="btn btn-danger-outline mt-3">
            الخروج من الفصل
          </button>
        </form>
      </div>
    </AppShell>
  );
}
