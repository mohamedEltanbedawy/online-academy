import Link from "next/link";
import { toggleActivityActive } from "@/app/actions/activities";
import { ActivityForm } from "@/components/activity-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  await requireRole("ADMIN");
  const activities = await prisma.activity.findMany({ include: { _count: { select: { enrollments: true } } }, orderBy: { scheduledAt: "desc" }, take: 100 });
  return (
    <AppShell
      title="الأنشطة والفعاليات"
      subtitle="رحلات، مسابقات، أنشطة فنية ورياضية."
    >
      <section className="section-card">
        <h2 className="section-title">فعالية جديدة</h2>
        <div className="mt-4">
          <ActivityForm />
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {activities.map((activity) => (
          <article key={activity.id} className="card p-5">
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{activity.title}</h2>
                <p className="text-sm text-slate-500">
                  {activity.type} • {activity.location || "بدون مكان"} •{" "}
                  <span className={activity.active ? "badge badge-green" : "badge badge-red"}>
                    {activity.active ? "نشطة" : "موقوفة"}
                  </span>
                </p>
              </div>
              <span className="text-sm text-blue-700">{activity._count.enrollments}/{activity.capacity}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{activity.description || "بدون وصف"}</p>
            <p className="mt-2 text-xs text-slate-500">{activity.scheduledAt.toLocaleString("ar-EG")}</p>
            <div className="mt-3 flex gap-3 text-sm">
              <Link href={`/admin/activities/${activity.id}/edit`} className="font-semibold text-blue-600 hover:underline">
                تعديل
              </Link>
              <form action={toggleActivityActive.bind(null, activity.id)}>
                <button type="submit" className={activity.active ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-emerald"}>
                  {activity.active ? "إيقاف الفعالية" : "تفعيل الفعالية"}
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
