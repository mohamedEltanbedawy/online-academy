import { AppShell } from "@/components/app-shell";
import { EventForm } from "@/components/family/event-form";
import { requireUser } from "@/lib/auth";
import { getMyFamilyMemberships, getFamilyEvents } from "@/lib/family";
import { toggleEventDone, deleteEvent } from "@/app/actions/family";

export const dynamic = "force-dynamic";

const eventTypeLabels: Record<string, string> = {
  LESSON: "حصة",
  ACTIVITY: "نشاط",
  APPOINTMENT: "موعد",
  BIRTHDAY: "عيد ميلاد",
  CUSTOM: "مناسبة",
};

export default async function FamilyEventsPage() {
  await requireUser();
  const memberships = await getMyFamilyMemberships();
  const families = memberships.map((m) => m.family);
  const from = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59);
  const events = await getFamilyEvents(from, to);

  return (
    <AppShell
      title="أحداث العائلة"
      subtitle="تقويم العائلة — حصص ومواعيد ومناسبات."
      actions={families.length > 0 ? undefined : undefined}
    >
      {families.length === 0 ? (
        <div className="empty-state">لسه مفيش عائلة مرتبطة بحسابك.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="section-card lg:col-span-2">
            <h2 className="section-title">أحداث الشهر ({from.toLocaleDateString("ar-EG", { month: "long", year: "numeric" })})</h2>
            {events.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">مفيش أحداث في الشهر ده — ضيف أول حدث من النموذج.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {events.map((event) => (
                  <li key={event.id} className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${event.completed ? "opacity-60" : ""}`}>
                    <div>
                      <p className={`text-base font-bold ${event.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                        {event.title}
                        <span className="badge badge-blue mr-2">{eventTypeLabels[event.type] ?? "مناسبة"}</span>
                        {event.completed && <span className="badge badge-green mr-2">خلصان</span>}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {event.startsAt.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })} — {event.startsAt.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                        {event.location ? ` — ${event.location}` : ""}
                      </p>
                      {event.notes && <p className="mt-1 text-sm text-slate-500">{event.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={toggleEventDone.bind(null, event.id)}>
                        <button type="submit" className="btn btn-outline btn-sm">{event.completed ? "إلغاء الإنجاز" : "تم"}</button>
                      </form>
                      <form action={deleteEvent.bind(null, event.id)}>
                        <button type="submit" className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100">حذف</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="section-card">
            <h2 className="section-title">إضافة حدث</h2>
            <div className="mt-4"><EventForm families={families.map((f) => ({ id: f.id, name: f.name }))} /></div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
