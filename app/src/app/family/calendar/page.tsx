import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getMyFamilyMemberships, getFamilyEvents } from "@/lib/family";

export const dynamic = "force-dynamic";

const dayNames = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const weekdayOrder = [6, 0, 1, 2, 3, 4, 5];

const eventTypeLabels: Record<string, string> = {
  LESSON: "حصة",
  ACTIVITY: "نشاط",
  APPOINTMENT: "موعد",
  BIRTHDAY: "عيد ميلاد",
  CUSTOM: "مناسبة",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function FamilyCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireUser();
  const memberships = await getMyFamilyMemberships();
  const families = memberships.map((m) => m.family);

  const params = await searchParams;
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m - 1;
    }
  }

  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0, 23, 59, 59);
  const events = await getFamilyEvents(from, to);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = weekdayOrder.indexOf(new Date(year, month, 1).getDay());
  const eventsByDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = `${e.startsAt.getFullYear()}-${pad(e.startsAt.getMonth() + 1)}-${pad(e.startsAt.getDate())}`;
    const list = eventsByDay.get(key) ?? [];
    list.push(e);
    eventsByDay.set(key, list);
  }

  const prevMonth = month === 0 ? `${year - 1}-12` : `${year}-${pad(month)}`;
  const nextMonth = month === 11 ? `${year + 1}-01` : `${year}-${pad(month + 2)}`;

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <AppShell
      title="تقويم العائلة"
      subtitle="كل أحداث العائلة في الشهر — حصص ومواعيد ومناسبات."
    >
      {families.length === 0 ? (
        <div className="empty-state">لسه مفيش عائلة مرتبطة بحسابك.</div>
      ) : (
        <section className="section-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">{new Date(year, month, 1).toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}</h2>
            <div className="flex items-center gap-2">
              <Link href={`/family/calendar?month=${prevMonth}`} className="btn btn-outline btn-sm">الشهر السابق</Link>
              <Link href="/family/calendar" className="btn btn-outline btn-sm">اليوم</Link>
              <Link href={`/family/calendar?month=${nextMonth}`} className="btn btn-outline btn-sm">الشهر الجاي</Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
            {dayNames.map((d) => (
              <div key={d} className="bg-slate-50 px-2 py-2 text-center text-xs font-bold text-slate-600">{d}</div>
            ))}
            {cells.map((day, i) => {
              const key = day ? `${year}-${pad(month + 1)}-${pad(day)}` : `empty-${i}`;
              const dayEvents = day ? eventsByDay.get(key) ?? [] : [];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <div key={key} className={`min-h-24 bg-white p-1.5 ${isToday ? "ring-2 ring-inset ring-blue-400" : ""}`}>
                  {day && (
                    <>
                      <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? "bg-blue-600 text-white" : "text-slate-600"}`}>{day}</span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div key={e.id} className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${e.completed ? "bg-slate-100 text-slate-400 line-through" : "bg-blue-50 text-blue-700"}`}>
                            {e.startsAt.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} {eventTypeLabels[e.type]} {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && <div className="px-1 text-[11px] text-slate-500">+{dayEvents.length - 3} أخرى</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
}
