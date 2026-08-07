import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getMyChildHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export default async function FamilyChildHealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getMyChildHealth(id);
  if (!data || !data.child) notFound();
  const { child, growth, vaccinations, medicines, documents } = data;

  const num = (v: unknown): number | null => (typeof v === "object" && v !== null && "toNumber" in v ? (v as { toNumber(): number }).toNumber() : (v as number | null) ?? null);

  return (
    <AppShell
      title={`الصحة — ${child.name}`}
      subtitle="ملف صحي لأولادك: النمو والتطعيمات والنوم والغذاء والأدوية."
      maxWidth="max-w-4xl"
    >
      <div className="mb-6">
        <Link href="/family" className="btn-outline">عودة للوحة الأسرة</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <span className="stat-label">قياسات النمو</span>
          <span className="stat-value">{growth.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">التطعيمات</span>
          <span className="stat-value">{vaccinations.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">الأدوية النشطة</span>
          <span className="stat-value">{medicines.filter((m) => m.active).length}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="section-card">
          <h2 className="section-title">آخر قياسات النمو</h2>
          {growth.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">لا توجد قياسات بعد.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {growth.slice(0, 5).map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="font-semibold">{g.date.toLocaleDateString("ar-EG")}</span>
                  <span className="text-slate-600">وزن {g.weightKg ? num(g.weightKg) : "-"} كجم • طول {g.heightCm ? num(g.heightCm) : "-"} سم</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="section-card">
          <h2 className="section-title">التطعيمات</h2>
          {vaccinations.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">لا توجد تطعيمات مسجلة.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {vaccinations.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="font-semibold">{v.name}</span>
                  <span className="text-slate-600">{v.date.toLocaleDateString("ar-EG")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="section-card">
          <h2 className="section-title">الأدوية الحالية</h2>
          {medicines.filter((m) => m.active).length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">لا توجد أدوية نشطة.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {medicines.filter((m) => m.active).map((m) => (
                <li key={m.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-semibold">{m.name} {m.dosage ? `— ${m.dosage}` : ""}</p>
                  <p className="mt-1 text-xs text-slate-600">{m.frequency || "بدون تكرار"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="section-card">
          <h2 className="section-title">الملفات المرفقة</h2>
          {documents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">لا توجد ملفات مرفقة.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="font-semibold">{d.title || d.fileName}</span>
                  <a href={`/api/health/documents?id=${d.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">فتح</a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
