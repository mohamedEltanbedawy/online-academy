import Link from "next/link";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

const features = [
  {
    icon: "💡",
    title: "حصص مباشرة",
    description: "قاعة درس حية فيها صوت وصورة وسبورة رقمية تفاعلية ورفع يد وشاشة.",
  },
  {
    icon: "📝",
    title: "واجبات وتصحيح",
    description: "حلول الطلبة تتصحح أونلاين مع درجات وملاحظات لكل طالب.",
  },
  {
    icon: "🎥",
    title: "حصص مسجلة",
    description: "كل حصة بتتسجل تلقائيًا وتتحفظ في مكتبة تشوفها في أي وقت.",
  },
  {
    icon: "🧒",
    title: "حضانة وأكاديمية",
    description: "برامج تربوية من سن سنتين حتى 14 سنة مع متابعة تطور الطفل.",
  },
  {
    icon: "💰",
    title: "دفع آمن",
    description: "ادفع كاش أو محمول أو فوري — وإيصالات وتسويات شفافة للمدرسين.",
  },
  {
    icon: "🛡️",
    title: "حسابات موثوقة",
    description: "أدوار واضحة للطلبة والمدرسين وأولياء الأمور والإدارة.",
  },
];

export default async function HomePage() {
  const locale = await getLocale();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-black text-white shadow-md shadow-blue-600/30">
              أ
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {t("منصة الدروس الخصوصية", locale)}
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="btn-ghost hidden sm:inline-flex"
            >
              {t("تسجيل الدخول", locale)}
            </Link>
            <Link href="/auth/register" className="btn-primary">
              {t("إنشاء حساب", locale)}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="py-16 text-center sm:py-24">
          <span className="badge badge-blue mb-6 animate-fade-up">
            🎓 مدرسة واحدة لكل أطفال القرية
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-slate-900 sm:text-6xl">
            <span className="bg-gradient-to-l from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {t("منصة الدروس الخصوصية", locale)}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            {t(
              "حصص خصوصية مباشرة بين المدرس والطلبة — سبورة رقمية، واجبات، وحصص مسجلة تشوفها في أي وقت.",
              locale
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/register" className="btn-primary btn-lg">
              {t("إنشاء حساب", locale)}
            </Link>
            <Link href="/auth/login" className="btn-outline btn-lg">
              {t("تسجيل الدخول", locale)}
            </Link>
          </div>
        </section>

        <section className="grid gap-5 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="grid size-12 place-items-center rounded-xl bg-blue-50 text-2xl">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500 sm:px-6">
          © {new Date().getFullYear()} — {t("منصة الدروس الخصوصية", locale)}
        </div>
      </footer>
    </div>
  );
}
