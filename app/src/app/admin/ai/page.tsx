import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AiProviderForm } from "@/components/ai-provider-form";
import { toggleAiProvider, setDefaultAiProvider, deleteAiProvider } from "@/app/actions/ai";

export const dynamic = "force-dynamic";

const providerLabels: Record<string, string> = {
  GEMINI: "Gemini",
  OPENAI: "OpenAI",
  OLLAMA: "محلي (Ollama)",
};

export default async function AdminAiPage() {
  await requireRole("ADMIN");
  const providers = await prisma.aiProvider.findMany({ orderBy: [{ isDefault: "desc" }, { enabled: "desc" }, { name: "asc" }] });

  return (
    <AppShell
      title="موديلات الذكاء الاصطناعي"
      subtitle="تحكّم في كل الموديلات المستخدمة في النظام — جاهز ومحلي — واختر الافتراضي."
    >
      <section className="section-card">
        <h2 className="section-title">إضافة موديل</h2>
        <div className="mt-4">
          <AiProviderForm />
        </div>
      </section>

      <section className="section-card mt-6">
        <h2 className="section-title">الموديلات ({providers.length})</h2>
        <div className="mt-4 space-y-3">
          {providers.map((p) => (
            <div key={p.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${p.enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70"}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{p.name}</span>
                  <span className="badge badge-blue">{providerLabels[p.provider] ?? p.provider}</span>
                  <span dir="ltr" className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">{p.modelName}</span>
                  {p.isDefault && <span className="badge badge-green">الافتراضي</span>}
                  <span className={p.enabled ? "badge badge-green" : "badge badge-red"}>{p.enabled ? "نشط" : "موقوف"}</span>
                  {p.supportsVision && <span className="badge badge-violet">يدعم الصور</span>}
                  {p.provider === "OLLAMA" && <span dir="ltr" className="text-xs text-slate-400">{p.baseUrl}</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {p.apiKey ? "مفتاح API محفوظ" : p.provider === "OLLAMA" ? "محلي — بدون مفتاح" : "بدون مفتاح API بعد"}
                  {p.temperature != null ? ` — الإبداع ${p.temperature}` : ""}
                  {p.maxTokens != null ? ` — أقصى ${p.maxTokens} رمز` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!p.isDefault && (
                  <form action={setDefaultAiProvider.bind(null, p.id)}>
                    <button type="submit" className="btn btn-outline btn-sm">اجعلها افتراضية</button>
                  </form>
                )}
                <form action={toggleAiProvider.bind(null, p.id)}>
                  <button type="submit" className="btn btn-outline btn-sm">{p.enabled ? "إيقاف" : "تفعيل"}</button>
                </form>
                {!p.isDefault && (
                  <form action={deleteAiProvider.bind(null, p.id)}>
                    <button type="submit" className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100">حذف</button>
                  </form>
                )}
                <Link href={`/admin/ai/${p.id}/edit`} className="btn btn-outline btn-sm">تعديل</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
