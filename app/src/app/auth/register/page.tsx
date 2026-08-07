import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/register-form";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function RegisterPage() {
  const locale = await getLocale();
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl font-black text-white shadow-lg shadow-blue-600/30">
            أ
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {t("إنشاء حساب جديد", locale)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("طالب أو مدرس — سجّل وابدأ", locale)}
          </p>
        </div>
        <div className="card p-6 shadow-lg shadow-slate-200/60 sm:p-8">
          <Suspense>
            <RegisterForm />
          </Suspense>
        </div>
        <p className="mt-5 text-center text-sm">
          <Link href="/" className="text-slate-500 transition hover:text-blue-600">
            → {t("الرجوع للصفحة الرئيسية", locale)}
          </Link>
        </p>
      </div>
    </main>
  );
}
