import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";
import { requirePermission } from "@/lib/permissions";
import { getChildHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

const dateFmt = (d: Date) => d.toLocaleDateString("ar-EG");

export default async function ChildHealthReportPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("health:view");
  const { id } = await params;
  const { child, growth, vaccinations, sleep, nutrition, medicines, documents } = await getChildHealth(id);
  if (!child) notFound();

  const age = child.birthDate
    ? (() => {
        const birth = new Date(child.birthDate);
        const now = new Date();
        const diff = now.getTime() - birth.getTime();
        const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
        const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
        return years > 0 ? `${years} سنة و${months} شهر` : `${months} شهر`;
      })()
    : "-";

  const num = (v: unknown): number | null => (typeof v === "object" && v !== null && "toNumber" in v ? (v as { toNumber(): number }).toNumber() : (v as number | null) ?? null);

  const latestGrowth = growth[0];
  const lastBmi = latestGrowth?.weightKg && latestGrowth.heightCm ? (num(latestGrowth.weightKg)! / Math.pow(num(latestGrowth.heightCm)! / 100, 2)).toFixed(1) : "-";

  return (
    <AppShell title={`تقرير صحي — ${child.name}`} subtitle="نسخة قابلة للطباعة." maxWidth="max-w-4xl">
      <div className="mb-6 flex flex-wrap gap-2 print:hidden">
        <PrintButton />
        <Link href={`/admin/children/${child.id}/health`} className="btn-outline">عودة للملف الصحي</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 print:border-none print:p-0">
        <div className="mb-6 border-b-2 border-blue-600 pb-4 text-center">
          <h1 className="text-2xl font-bold text-slate-800">التقرير الصحي</h1>
          <p className="mt-1 text-sm text-slate-500">تقرير متابعة صحة الطفل — بتاريخ {new Date().toLocaleDateString("ar-EG")}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCard label="اسم الطفل" value={child.name} />
          <InfoCard label="العمر" value={age} />
          <InfoCard label="المرحلة" value={child.stage || "-"} />
          <InfoCard label="آخر قياس" value={latestGrowth ? `${latestGrowth.weightKg ?? "-"} كجم / ${latestGrowth.heightCm ?? "-"} سم` : "-"} />
        </div>

        <ReportSection title="النمو (وزن / طول)" empty={growth.length === 0}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="py-2 font-semibold">التاريخ</th>
                <th className="py-2 font-semibold">الوزن (كجم)</th>
                <th className="py-2 font-semibold">الطول (سم)</th>
                <th className="py-2 font-semibold">محيط الرأس (سم)</th>
                <th className="py-2 font-semibold">BMI</th>
                <th className="py-2 font-semibold">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {growth.map((g) => (
                <tr key={g.id} className="border-b border-slate-100">
                  <td className="py-2">{dateFmt(g.date)}</td>
                  <td className="py-2">{g.weightKg ? num(g.weightKg) : "-"}</td>
                  <td className="py-2">{g.heightCm ? num(g.heightCm) : "-"}</td>
                  <td className="py-2">{g.headCm ? num(g.headCm) : "-"}</td>
                  <td className="py-2">{g.weightKg && g.heightCm ? (num(g.weightKg)! / Math.pow(num(g.heightCm)! / 100, 2)).toFixed(1) : "-"}</td>
                  <td className="py-2">{g.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {latestGrowth && <p className="mt-2 text-sm text-slate-500">آخر BMI: {lastBmi}</p>}
        </ReportSection>

        <ReportSection title="التطعيمات" empty={vaccinations.length === 0}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="py-2 font-semibold">التطعيم</th>
                <th className="py-2 font-semibold">الجرعة</th>
                <th className="py-2 font-semibold">التاريخ</th>
                <th className="py-2 font-semibold">القادمة</th>
                <th className="py-2 font-semibold">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {vaccinations.map((v) => (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="py-2">{v.name}</td>
                  <td className="py-2">{v.dose ?? "-"}</td>
                  <td className="py-2">{dateFmt(v.date)}</td>
                  <td className="py-2">{v.nextDueDate ? dateFmt(v.nextDueDate) : "-"}</td>
                  <td className="py-2">{v.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection title="النوم" empty={sleep.length === 0}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="py-2 font-semibold">التاريخ</th>
                <th className="py-2 font-semibold">الساعات</th>
                <th className="py-2 font-semibold">الجودة</th>
                <th className="py-2 font-semibold">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {sleep.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2">{dateFmt(s.date)}</td>
                  <td className="py-2">{s.hours ? num(s.hours) : "-"}</td>
                  <td className="py-2">{s.quality ?? "-"}</td>
                  <td className="py-2">{s.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection title="الغذاء" empty={nutrition.length === 0}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="py-2 font-semibold">التاريخ</th>
                <th className="py-2 font-semibold">الوجبة</th>
                <th className="py-2 font-semibold">الأطعمة</th>
                <th className="py-2 font-semibold">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {nutrition.map((n) => (
                <tr key={n.id} className="border-b border-slate-100">
                  <td className="py-2">{dateFmt(n.date)}</td>
                  <td className="py-2">{n.meal ?? "-"}</td>
                  <td className="py-2">{n.foods}</td>
                  <td className="py-2">{n.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection title="الأدوية" empty={medicines.length === 0}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="py-2 font-semibold">الدواء</th>
                <th className="py-2 font-semibold">الجرعة</th>
                <th className="py-2 font-semibold">التكرار</th>
                <th className="py-2 font-semibold">الفترة</th>
                <th className="py-2 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-2">{m.name}</td>
                  <td className="py-2">{m.dosage ?? "-"}</td>
                  <td className="py-2">{m.frequency ?? "-"}</td>
                  <td className="py-2">{m.startDate ? `${dateFmt(m.startDate)} ${m.endDate ? `→ ${dateFmt(m.endDate)}` : ""}` : "-"}</td>
                  <td className="py-2">{m.active ? "نشط" : "متوقف"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection title={`الملفات المرفقة (${documents.length})`} empty={documents.length === 0}>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {documents.map((d) => (
              <li key={d.id}>{d.title || d.fileName} — {d.category || "بدون تصنيف"}</li>
            ))}
          </ul>
        </ReportSection>
      </div>
    </AppShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value}</p>
    </div>
  );
}

function ReportSection({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800">{title}</h2>
      {empty ? <p className="text-sm text-slate-400">لا توجد بيانات.</p> : children}
    </section>
  );
}
