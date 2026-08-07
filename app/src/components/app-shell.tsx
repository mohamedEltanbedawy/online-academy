import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { LogoutButton } from "@/components/logout-button";

const roleNames: Record<string, string> = {
  TEACHER: "مدرس",
  STUDENT: "طالب",
  ADMIN: "مشرف عام",
  CASHIER: "منفذ بيع",
  PARENT: "ولي أمر",
  STAFF: "أخصائي",
};

const roleHome: Record<string, string> = {
  TEACHER: "/teacher",
  STUDENT: "/student",
  ADMIN: "/admin",
  CASHIER: "/cashier",
  PARENT: "/parent",
  STAFF: "/staff",
};

const roleNav: Record<string, { href: string; label: string }[]> = {
  TEACHER: [
    { href: "/teacher", label: "لوحة المدرس" },
    { href: "/teacher/profile", label: "بياناتي" },
  ],
  STUDENT: [{ href: "/student", label: "لوحة الطالب" }],
  ADMIN: [{ href: "/admin", label: "لوحة الإدارة" }],
  CASHIER: [{ href: "/cashier", label: "التحصيل" }],
  PARENT: [{ href: "/parent", label: "أطفالي" }, { href: "/family", label: "عائلتي" }],
  STAFF: [{ href: "/staff", label: "الأطفال" }],
};

export async function AppShell({
  title,
  subtitle,
  actions,
  children,
  maxWidth = "max-w-6xl",
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const user = await requireUser();
  const locale = await getLocale();
  const home = roleHome[user.role] ?? "/dashboard";
  const nav = roleNav[user.role] ?? [];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href={home} className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-black text-white shadow-md shadow-blue-600/30">
              أ
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {t("منصة الدروس الخصوصية", locale)}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {t(item.label, locale)}
              </Link>
            ))}
            <Link href="/family" className="nav-link">
              {t("عائلتي", locale)}
            </Link>
            <Link href="/profile" className="nav-link">
              {t("ملفي الشخصي", locale)}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 sm:inline-flex">
              {user.name}
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                {t(roleNames[user.role] ?? user.role, locale)}
              </span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className={`mx-auto w-full px-4 py-6 sm:px-6 ${maxWidth}`}>
        <div className="page-header mb-6 animate-fade-up">
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
