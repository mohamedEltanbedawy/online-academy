import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function CashierPage() {
  const cashier = await requireRole("CASHIER");
  const actions = [
    { href: "/cashier/payments/new", title: "تسجيل دفعة فصل", description: "استقبال دفعة درس خصوصي وإصدار إيصال.", icon: "💵", color: "from-emerald-500 to-teal-600", cta: true },
    { href: "/cashier/nursery", title: "سداد فواتير الحضانة", description: "تحصيل اشتراكات وفواتير الأطفال.", icon: "🧒", color: "from-blue-500 to-violet-600" },
    { href: "/cashier/payments", title: "سجل المدفوعات", description: "مراجعة كل الإيصالات والتحصيلات.", icon: "📒", color: "from-amber-500 to-orange-600" },
  ];
  return (
    <AppShell
      title={`منفذ البيع — أهلاً ${cashier.name}`}
      subtitle="سجّل المدفوعات وفعّل الطلاب من هنا."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="card group flex items-center gap-4 p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${a.color} text-3xl shadow-md`}>
              {a.icon}
            </span>
            <div>
              <h2 className="font-bold text-slate-900 group-hover:text-blue-700">{a.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{a.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
