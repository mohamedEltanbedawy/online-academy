import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const teacher = await requireRole("TEACHER");
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: teacher.id },
  });
  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id },
    include: {
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      title={`لوحة المدرس — أهلاً أ/ ${teacher.name}`}
      subtitle="فصولك وطلبتك وجداولك كلها من هنا."
      actions={
        <Link href="/teacher/classes/new" className="btn-primary">
          + إنشاء فصل جديد
        </Link>
      }
    >
      {profile ? (
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile.subject}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {profile.bio || "لا يوجد وصف بعد"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge badge-blue">سعر الحصة: {formatMoney(profile.defaultHourlyRate)} ج.م</span>
                <span className="badge badge-violet">نسبة المنصة: {formatMoney(profile.defaultPlatformPercent)}٪</span>
                <span className="badge badge-slate">كلفة ثابتة: {formatMoney(profile.defaultFixedFee)} ج.م</span>
              </div>
            </div>
            <Link href="/teacher/profile" className="btn-outline">
              تعديل بياناتي
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-900">كمّل بياناتك الأول</h2>
          <p className="mt-1 text-sm text-amber-800">
            محتاج تكمل بياناتك (المادة والأسعار) قبل ما تعمل فصل.
          </p>
          <Link
            href="/teacher/profile"
            className="btn-amber mt-3"
          >
            كمّل بياناتي
          </Link>
        </section>
      )}

      <section className="mt-8">
        <h2 className="section-title mb-4">فصولك</h2>
        {classes.length === 0 ? (
          <div className="empty-state">
            لسه مفيش فصول — اضغط «إنشاء فصل جديد» وابدأ.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="card p-5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{cls.name}</h3>
                  {cls.status === "ARCHIVED" ? (
                    <span className="badge badge-slate">مقفول</span>
                  ) : (
                    <span className="badge badge-green">نشط</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{cls.subject}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-blue-600">
                    {formatMoney(cls.pricePerHour)} ج.م / حصة
                  </span>
                  <span className="text-slate-500">{cls._count.enrollments} طالب</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>الكود: {cls.inviteCode}</span>
                  <span>نسبة {formatMoney(cls.platformPercent)}٪ / كلفة {formatMoney(cls.fixedFee)} ج.م</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
