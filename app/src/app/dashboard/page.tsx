import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

const roleNames: Record<string, string> = {
  TEACHER: "مدرس",
  STUDENT: "طالب",
  ADMIN: "مشرف عام",
  CASHIER: "موظف منفذ بيع",
  PARENT: "ولي أمر",
  STAFF: "أخصائي",
};

const roleCards: Record<string, { href: string; title: string; description: string; icon: string; color: string }[]> = {
  TEACHER: [
    { href: "/teacher", title: "لوحة المدرس", description: "فصولك وطلبتك وجداول الحصص.", icon: "🧑‍🏫", color: "from-blue-500 to-violet-600" },
    { href: "/teacher/classes/new", title: "إنشاء فصل", description: "ابدأ فصلًا جديدًا بكود دعوة.", icon: "➕", color: "from-emerald-500 to-teal-600" },
    { href: "/teacher/profile", title: "بياناتي", description: "المادة والأسعار والوصف.", icon: "📋", color: "from-amber-500 to-orange-600" },
  ],
  STUDENT: [
    { href: "/student", title: "لوحة الطالب", description: "فصولك وحصصك المسجلة.", icon: "🎒", color: "from-blue-500 to-violet-600" },
    { href: "/join", title: "الانضمام بكود", description: "ادخل كود الدعوة من مدرسك.", icon: "🔑", color: "from-emerald-500 to-teal-600" },
  ],
  ADMIN: [
    { href: "/admin", title: "لوحة الإدارة", description: "إدارة المستخدمين والفصول والمدرسين والماليات.", icon: "🛡️", color: "from-indigo-500 to-violet-600" },
    { href: "/admin/children", title: "الأطفال والبرامج", description: "ملفات الأطفال وتقييماتهم.", icon: "🧒", color: "from-emerald-500 to-teal-600" },
    { href: "/admin/nursery/billing", title: "اشتراكات الحضانة", description: "الفواتير والمدفوعات الشهرية.", icon: "💰", color: "from-amber-500 to-orange-600" },
  ],
  CASHIER: [
    { href: "/cashier", title: "لوحة التحصيل", description: "استقبال المدفوعات وإصدار الإيصالات.", icon: "💵", color: "from-emerald-500 to-teal-600" },
  ],
  PARENT: [
    { href: "/parent", title: "أطفالي", description: "ملفات أطفالك وبرامجهم وتقاريرهم.", icon: "👨‍👧", color: "from-blue-500 to-violet-600" },
    { href: "/parent/activities", title: "الأنشطة", description: "سجّل أطفالك في الفعاليات.", icon: "🎨", color: "from-emerald-500 to-teal-600" },
    { href: "/parent/billing", title: "الفواتير", description: "دفع اشتراكات الحضانة.", icon: "💳", color: "from-amber-500 to-orange-600" },
  ],
  STAFF: [
    { href: "/staff", title: "لوحة الأخصائي", description: "متابعة الأطفال والأنشطة.", icon: "🧩", color: "from-blue-500 to-violet-600" },
  ],
};

export default async function DashboardPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const cards = roleCards[user.role] ?? [];

  return (
    <AppShell
      title={`${t("أهلاً", locale)}، ${user.name}`}
      subtitle={`${t("نوع الحساب:", locale)} ${t(roleNames[user.role] ?? user.role, locale)}`}
    >
      <section className="card bg-gradient-to-l from-blue-600 to-violet-600 p-8 text-white shadow-lg shadow-blue-600/20">
        <p className="text-lg font-bold">{t("لوحتك", locale)}</p>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-blue-50">
          {t("من هنا تتحرك في كل حاجة تخص دورك — فصول، حصص، واجبات، أطفال، مدفوعات.", locale)}
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card group p-5 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${card.color} text-2xl shadow-md`}>
                {card.icon}
              </span>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-700">
                  {t(card.title, locale)}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">{t(card.description, locale)}</p>
              </div>
            </div>
          </Link>
        ))}
        <Link
          href="/profile"
          className="card group p-5 transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-2xl shadow-md">
              👤
            </span>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-blue-700">
                {t("ملفي الشخصي", locale)}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">البيانات وكلمة المرور</p>
            </div>
          </div>
        </Link>
      </section>
    </AppShell>
  );
}
