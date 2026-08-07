import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlanItemForm } from "@/components/family/plan-item-form";
import { requireUser } from "@/lib/auth";
import { getMyFamilyMemberships, getFamilyPersons, getPlanItemsForDay } from "@/lib/family";
import { togglePlanItemDone, deletePlanItem } from "@/app/actions/family";

export const dynamic = "force-dynamic";

function toLocalDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function FamilyPlanPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireUser();
  const memberships = await getMyFamilyMemberships();
  const families = memberships.map((m) => m.family);
  const params = await searchParams;
  const dayParam = params.date && !Number.isNaN(new Date(`${params.date}T00:00:00`).getTime()) ? new Date(`${params.date}T00:00:00`) : new Date();
  const dayParamRaw = toLocalDateString(dayParam);
  const items = await getPlanItemsForDay(dayParam);
  const persons = await getFamilyPersons();

  const prev = new Date(dayParam.getFullYear(), dayParam.getMonth(), dayParam.getDate() - 1);
  const next = new Date(dayParam.getFullYear(), dayParam.getMonth(), dayParam.getDate() + 1);

  return (
    <AppShell
      title="الخطة اليومية"
      subtitle="خطة الأسرة اليومية — مهام وحصص وأنشطة وتذكيرات."
    >
      {families.length === 0 ? (
        <div className="empty-state">لسه مفيش عائلة مرتبطة بحسابك.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="section-card lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="section-title">خطة {dayParam.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}</h2>
              <div className="flex items-center gap-2">
                <Link href={`/family/plan?date=${toLocalDateString(prev)}`} className="btn btn-outline btn-sm">اليوم السابق</Link>
                <Link href="/family/plan" className="btn btn-outline btn-sm">اليوم</Link>
                <Link href={`/family/plan?date=${toLocalDateString(next)}`} className="btn btn-outline btn-sm">اليوم الجاي</Link>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">الرابط: /family/plan?date={dayParamRaw}</p>
            {items.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">مفيش عناصر في خطة اليوم ده — ضيف أول عنصر من النموذج.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.id} className={`card flex items-center justify-between gap-3 p-4 ${item.done ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3">
                      <form action={togglePlanItemDone.bind(null, item.id)}>
                        <button type="submit" className={`grid size-7 place-items-center rounded-lg border text-sm ${item.done ? "border-green-500 bg-green-500 text-white" : "border-slate-300 hover:border-green-400"}`}>
                          {item.done ? "✓" : ""}
                        </button>
                      </form>
                      <div>
                        <p className={`text-base font-bold ${item.done ? "text-slate-400 line-through" : "text-slate-900"}`}>{item.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {item.time ? `${item.time} — ` : ""}
                          {item.type === "TASK" ? "مهمة" : item.type === "LESSON" ? "حصة" : item.type === "ACTIVITY" ? "نشاط" : "تذكير"}
                          {item.assignedTo ? ` — ${item.assignedTo.fullName}` : ""}
                          {item.doneAt && <span className="text-slate-400"> — اتعملت {item.doneAt.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>}
                        </p>
                      </div>
                    </div>
                    <form action={deletePlanItem.bind(null, item.id)}>
                      <button type="submit" className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100">حذف</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="section-card">
            <h2 className="section-title">إضافة عنصر</h2>
            <div className="mt-4"><PlanItemForm persons={persons} defaultDay={dayParamRaw} /></div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
