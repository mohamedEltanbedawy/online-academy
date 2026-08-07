import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requirePermission, hasPermission } from "@/lib/permissions";
import { getChildHealth } from "@/lib/health";
import { GrowthForm, VaccinationForm, SleepForm, NutritionForm, MedicineForm, HealthTabs } from "@/components/health/health-forms";
import { HealthUploadForm } from "@/components/health/health-upload-form";
import { DeleteHealthButton } from "@/components/health/delete-health-button";

export const dynamic = "force-dynamic";

export default async function ChildHealthPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("health:view");
  const canManage = await hasPermission("health:manage");
  const canDocuments = await hasPermission("health:documents");
  const { id } = await params;

  const { child, growth, vaccinations, sleep, nutrition, medicines, documents } = await getChildHealth(id);
  if (!child) notFound();

  const bmi = (weightKg?: number, heightCm?: number) => {
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
  };

  const num = (v: unknown): number | null => (typeof v === "object" && v !== null && "toNumber" in v ? (v as { toNumber(): number }).toNumber() : (v as number | null) ?? null);

  const tabs = [
    {
      id: "growth",
      label: "النمو",
      content: (
        <div className="space-y-4">
          {canManage && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-700">إضافة قياس</h3>
              <GrowthForm childId={child.id} />
            </div>
          )}
          <div className="space-y-2">
            {growth.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد قياسات نمو.</p>
            ) : (
              growth.map((g) => (
                <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold">{g.date.toLocaleDateString("ar-EG")}</p>
                    <p className="text-xs text-slate-600">
                      الوزن: {g.weightKg ? num(g.weightKg) : "-"} كجم • الطول: {g.heightCm ? num(g.heightCm) : "-"} سم • محيط الرأس: {g.headCm ? num(g.headCm) : "-"} سم
                      {g.weightKg && g.heightCm && <span className="mr-2">BMI: {bmi(num(g.weightKg)!, num(g.heightCm)!)}</span>}
                    </p>
                    {g.notes && <p className="text-xs text-slate-500">{g.notes}</p>}
                  </div>
                  {canManage && <DeleteHealthButton id={g.id} kind="growth" label="حذف القياس" />}
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      id: "vaccinations",
      label: "التطعيمات",
      content: (
        <div className="space-y-4">
          {canManage && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-700">إضافة تطعيم</h3>
              <VaccinationForm childId={child.id} />
            </div>
          )}
          <div className="space-y-2">
            {vaccinations.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد تطعيمات.</p>
            ) : (
              vaccinations.map((v) => {
                const overdue = v.nextDueDate && v.nextDueDate < new Date();
                return (
                  <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                    <div className="space-y-1">
                      <p className="font-semibold">{v.name} {v.dose ? `— ${v.dose}` : ""}</p>
                      <p className="text-xs text-slate-600">
                        تاريخ التطعيم: {v.date.toLocaleDateString("ar-EG")}
                        {v.nextDueDate && (
                          <span className={`mr-2 ${overdue ? "text-red-600" : ""}`}>
                            • القادمة: {v.nextDueDate.toLocaleDateString("ar-EG")} {overdue ? "(متأخرة!)" : ""}
                          </span>
                        )}
                      </p>
                      {v.notes && <p className="text-xs text-slate-500">{v.notes}</p>}
                    </div>
                    {canManage && <DeleteHealthButton id={v.id} kind="vaccination" label="حذف" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ),
    },
    {
      id: "sleep",
      label: "النوم",
      content: (
        <div className="space-y-4">
          {canManage && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-700">إضافة سجل نوم</h3>
              <SleepForm childId={child.id} />
            </div>
          )}
          <div className="space-y-2">
            {sleep.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد سجلات نوم.</p>
            ) : (
              sleep.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold">{s.date.toLocaleDateString("ar-EG")} — {s.hours ? num(s.hours) : "-"} ساعات</p>
                    <p className="text-xs text-slate-600">{s.quality || "بدون تقييم"}{s.notes ? ` — ${s.notes}` : ""}</p>
                  </div>
                  {canManage && <DeleteHealthButton id={s.id} kind="sleep" label="حذف" />}
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      id: "nutrition",
      label: "الغذاء",
      content: (
        <div className="space-y-4">
          {canManage && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-700">إضافة سجل غذاء</h3>
              <NutritionForm childId={child.id} />
            </div>
          )}
          <div className="space-y-2">
            {nutrition.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد سجلات غذاء.</p>
            ) : (
              nutrition.map((n) => (
                <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold">{n.date.toLocaleDateString("ar-EG")} — {n.meal}</p>
                    <p className="text-xs text-slate-600">{n.foods}</p>
                    {n.notes && <p className="text-xs text-slate-500">{n.notes}</p>}
                  </div>
                  {canManage && <DeleteHealthButton id={n.id} kind="nutrition" label="حذف" />}
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      id: "medicines",
      label: "الأدوية",
      content: (
        <div className="space-y-4">
          {canManage && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-700">إضافة دواء</h3>
              <MedicineForm childId={child.id} />
            </div>
          )}
          <div className="space-y-2">
            {medicines.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد أدوية.</p>
            ) : (
              medicines.map((m) => (
                <div key={m.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-sm ${m.active ? "bg-slate-50" : "bg-slate-100 opacity-60"}`}>
                  <div className="space-y-1">
                    <p className="font-semibold">{m.name} {m.dosage ? `— ${m.dosage}` : ""}</p>
                    <p className="text-xs text-slate-600">
                      {m.frequency || "بدون تكرار"}
                      {m.startDate && <span className="mr-2">من {m.startDate.toLocaleDateString("ar-EG")}</span>}
                      {m.endDate && <span>إلى {m.endDate.toLocaleDateString("ar-EG")}</span>}
                    </p>
                    {m.notes && <p className="text-xs text-slate-500">{m.notes}</p>}
                  </div>
                  {canManage && <DeleteHealthButton id={m.id} kind="medicine" label={m.active ? "إيقاف" : "استئناف"} active={m.active} />}
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },
    ...(canDocuments
      ? [
          {
            id: "documents",
            label: "الملفات",
            content: (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-700">رفع ملف (صورة/PDF)</h3>
                  <HealthUploadForm childId={child.id} />
                </div>
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-slate-500">لا توجد ملفات.</p>
                  ) : (
                    documents.map((d) => (
                      <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                        <div className="space-y-1">
                          <p className="font-semibold">{d.title || d.fileName}</p>
                          <p className="text-xs text-slate-600">{d.category || "بدون تصنيف"} • {d.fileName} • {Math.round(d.sizeBytes / 1024)} كيلوبايت • {d.createdAt.toLocaleDateString("ar-EG")}</p>
                        </div>
                        <div className="flex gap-2">
                          <a href={`/api/health/documents?id=${d.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">فتح</a>
                          <DeleteHealthButton id={d.id} kind="document" label="حذف" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <AppShell
      title={`الملف الصحي — ${child.name}`}
      subtitle="النمو والتطعيمات والنوم والغذاء والأدوية والملفات."
      maxWidth="max-w-5xl"
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/admin/children/${child.id}/health/report`} className="btn-primary">طباعة تقرير صحي (PDF)</Link>
        <Link href={`/admin/children/${child.id}/health/ai`} className="btn-outline">إدخال بالذكاء الاصطناعي (نص/صورة)</Link>
        <Link href={`/admin/children/${child.id}`} className="btn-outline">عودة لملف الطفل</Link>
      </div>

      <section className="section-card">
        <h2 className="section-title">التسجيل الصحي</h2>
        <div className="mt-4">
          <HealthTabs tabs={tabs} />
        </div>
      </section>
    </AppShell>
  );
}
