import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const adminNav = [
  { href: "/admin/users", title: "المستخدمين", icon: "👥", color: "from-blue-500 to-violet-600" },
  { href: "/admin/children", title: "الأطفال", icon: "🧒", color: "from-emerald-500 to-teal-600" },
  { href: "/admin/classes", title: "الفصول", icon: "🏫", color: "from-indigo-500 to-blue-600" },
  { href: "/admin/programs", title: "المراحل والبرامج", icon: "🗂️", color: "from-violet-500 to-purple-600" },
  { href: "/admin/skills", title: "مهارات التقييم", icon: "🎯", color: "from-pink-500 to-rose-600" },
  { href: "/admin/activities", title: "الأنشطة والفعاليات", icon: "🎨", color: "from-amber-500 to-orange-600" },
  { href: "/admin/homework", title: "الواجبات", icon: "📝", color: "from-cyan-500 to-sky-600" },
  { href: "/admin/recordings", title: "التسجيلات", icon: "🎬", color: "from-rose-500 to-red-600" },
  { href: "/admin/nursery/billing", title: "اشتراكات الحضانة", icon: "💰", color: "from-emerald-500 to-green-600" },
  { href: "/admin/payments", title: "تقرير المدفوعات", icon: "💳", color: "from-blue-500 to-cyan-600" },
  { href: "/admin/payouts", title: "تسويات المدرسين", icon: "🧾", color: "from-fuchsia-500 to-purple-600" },
  { href: "/admin/audit", title: "سجل التعديلات", icon: "📜", color: "from-slate-500 to-slate-700" },
  { href: "/admin/ai", title: "الذكاء الاصطناعي", icon: "🤖", color: "from-purple-500 to-indigo-600" },
  { href: "/admin/permissions", title: "الأدوار والصلاحيات", icon: "🔐", color: "from-teal-500 to-cyan-600" },
  { href: "/admin/telegram", title: "بوت تيليجرام", icon: "✈️", color: "from-sky-500 to-blue-600" },
];

export default async function AdminDashboardPage() {
  const admin = await requireRole("ADMIN");
  const [users, teachers, students, classes, enrollments, homeworks, recordings, paid] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.class.count({ where: { status: "ACTIVE" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.homework.count(),
    prisma.recording.count({ where: { status: "STOPPED" } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
  ]);
  const latestPayments = await prisma.payment.findMany({ take: 8, orderBy: { paidAt: "desc" }, include: { student: { select: { name: true } }, class: { select: { name: true } } } });

  const stats = [
    { label: "كل المستخدمين", value: users, icon: "👥", color: "from-blue-500 to-violet-600" },
    { label: "المدرسون", value: teachers, icon: "🧑‍🏫", color: "from-emerald-500 to-teal-600" },
    { label: "الطلاب", value: students, icon: "🎒", color: "from-indigo-500 to-blue-600" },
    { label: "الفصول النشطة", value: classes, icon: "🏫", color: "from-violet-500 to-purple-600" },
    { label: "اشتراكات الفصول", value: enrollments, icon: "📌", color: "from-amber-500 to-orange-600" },
    { label: "الواجبات", value: homeworks, icon: "📝", color: "from-cyan-500 to-sky-600" },
    { label: "التسجيلات", value: recordings, icon: "🎬", color: "from-rose-500 to-red-600" },
    { label: "عدد المدفوعات", value: paid._count, icon: "💳", color: "from-emerald-500 to-green-600" },
  ];

  return (
    <AppShell
      title="لوحة الإدارة الموحدة"
      subtitle={`أهلاً ${admin.name} — كل مؤشرات المنصة من مكان واحد.`}
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{s.label}</p>
              <span className={`grid size-9 place-items-center rounded-lg bg-gradient-to-br ${s.color} text-base shadow-sm`}>
                {s.icon}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="card border-emerald-200 bg-gradient-to-l from-emerald-50 to-teal-50 p-6">
        <p className="text-sm text-emerald-700">إجمالي المدفوعات المسجلة</p>
        <p className="mt-1 text-3xl font-bold text-emerald-800">{formatMoney(paid._sum.amount ?? 0)} ج.م</p>
      </section>

      <section className="mt-8">
        <h2 className="section-title mb-4">أقسام الإدارة</h2>
        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card group flex items-center gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.color} text-xl shadow-sm`}>
                {item.icon}
              </span>
              <span className="font-bold text-slate-800 group-hover:text-blue-700">{item.title}</span>
            </Link>
          ))}
        </nav>
      </section>

      <section className="card mt-8 p-6">
        <h2 className="section-title mb-4">آخر المدفوعات</h2>
        {latestPayments.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد مدفوعات.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الإيصال</th>
                  <th>الطالب</th>
                  <th>الفصل</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {latestPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-mono">{payment.receiptNumber}</td>
                    <td>{payment.student?.name ?? "-"}</td>
                    <td>{payment.class?.name ?? "-"}</td>
                    <td className="font-bold">{formatMoney(payment.amount)} ج.م</td>
                    <td className="text-slate-500">{payment.paidAt.toLocaleDateString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
