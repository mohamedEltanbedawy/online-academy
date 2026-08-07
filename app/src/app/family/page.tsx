import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getMyFamilyMemberships, getChildrenEducationSummary, getPlanItemsForDay, getFamilyEvents } from "@/lib/family";
import { togglePlanItemDone, toggleEventDone } from "@/app/actions/family";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const user = await requireUser();
  const memberships = await getMyFamilyMemberships();
  const families = memberships.map((m) => m.family);
  const today = new Date();
  const plan = await getPlanItemsForDay(today);
  const upcomingEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
  const upcoming = (await getFamilyEvents(today, upcomingEnd)).filter((e) => !e.completed);
  const education = await getChildrenEducationSummary();

  const members = [...new Map(families.flatMap((f) => f.members).map((m) => [m.person.id, m])).values()];

  return (
    <AppShell
      title="لوحة الأسرة"
      subtitle={`أهلاً ${user.name} — يومك وتقويمك وأولادك في مكان واحد.`}
      actions={
        <>
          <Link href="/family/plan" className="btn-outline">الخطة اليومية</Link>
          <Link href="/family/calendar" className="btn-outline">التقويم</Link>
          <Link href="/family/events" className="btn-outline">الأحداث</Link>
          <Link href="/family/members" className="btn-outline">الأفراد</Link>
        </>
      }
    >
      {families.length === 0 ? (
        <div className="empty-state">لسه مفيش عائلة مرتبطة بحسابك — اتواصل مع الإدارة عشان تربطك بعائلتك.</div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="stat-card">
              <span className="stat-label">العائلات</span>
              <span className="stat-value">{families.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">أفراد العائلة</span>
              <span className="stat-value">{members.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">أولاد في التعليم</span>
              <span className="stat-value">{education.length}</span>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="section-card">
              <h2 className="section-title">خطة النهارده</h2>
              {plan.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">مفيش حاجة مجدولة النهارده — ضيف مهام من الخطة اليومية.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {plan.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center gap-3">
                        <form action={togglePlanItemDone.bind(null, item.id)}>
                          <button type="submit" className={`grid size-6 place-items-center rounded-md border text-xs ${item.done ? "border-green-500 bg-green-500 text-white" : "border-slate-300 hover:border-green-400"}`}>
                            {item.done ? "✓" : ""}
                          </button>
                        </form>
                        <div>
                          <p className={`text-sm font-semibold ${item.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{item.title}</p>
                          <p className="text-xs text-slate-500">
                            {item.time ? `${item.time} — ` : ""}{item.type === "TASK" ? "مهمة" : item.type === "LESSON" ? "حصة" : item.type === "ACTIVITY" ? "نشاط" : "تذكير"}
                            {item.assignedTo ? ` — ${item.assignedTo.fullName}` : ""}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/family/plan" className="mt-4 inline-block text-sm font-bold text-blue-600 hover:underline">فتح الخطة اليومية ←</Link>
            </section>

            <section className="section-card">
              <h2 className="section-title">الأحداث الجاية (أسبوعان)</h2>
              {upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">مفيش أحداث جاية — ضيف أول حدث من صفحة الأحداث.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcoming.slice(0, 6).map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {event.startsAt.toLocaleDateString("ar-EG")} — {event.startsAt.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          {event.location ? ` — ${event.location}` : ""}
                        </p>
                      </div>
                      <form action={toggleEventDone.bind(null, event.id)}>
                        <button type="submit" className="btn btn-outline btn-sm">خلصان</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/family/calendar" className="mt-4 inline-block text-sm font-bold text-blue-600 hover:underline">فتح التقويم ←</Link>
            </section>
          </div>

          <section className="section-card mt-6">
            <h2 className="section-title">أولادك في التعليم</h2>
            {education.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">لسه مفيش أطفال مرتبطين بالعائلة.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {education.map(({ child, subscription, assessmentsCount, activitiesCount, programsCount }) => (
                  <article key={child.id} className="card p-5">
                    <h3 className="text-lg font-bold text-slate-900">{child.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">الميلاد: {child.birthDate.toLocaleDateString("ar-EG")}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={`badge ${subscription ? "badge-green" : "badge-slate"}`}>{subscription ? `اشتراك: ${subscription.planName}` : "بدون اشتراك"}</span>
                      {subscription && <span className={`badge ${subscription.status === "ACTIVE" ? "badge-green" : "badge-red"}`}>{subscription.status === "ACTIVE" ? "نشط" : subscription.status === "PAUSED" ? "موقوف" : subscription.status === "PAST_DUE" ? "متأخر" : "ملغي"}</span>}
                      <span className="badge badge-blue">تقييمات: {assessmentsCount}</span>
                      <span className="badge badge-violet">برامج: {programsCount}</span>
                      <span className="badge badge-blue">أنشطة: {activitiesCount}</span>
                    </div>
                    <Link href={`/parent/children/${child.id}`} className="mt-4 inline-block text-sm font-bold text-blue-600 hover:underline">فتح ملف الطفل ←</Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
