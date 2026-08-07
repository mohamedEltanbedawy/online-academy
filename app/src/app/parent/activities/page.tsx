import { AppShell } from "@/components/app-shell";
import { enrollChildActivity } from "@/app/actions/activities";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParentActivitiesPage() {
  const parent = await requireRole("PARENT");
  const children = await prisma.childGuardian.findMany({ where: { guardianId: parent.id }, select: { childId: true, child: { select: { name: true } } } });
  const childIds = children.map((item) => item.childId);
  const activities = await prisma.activity.findMany({ where: { active: true, scheduledAt: { gte: new Date() } }, include: { enrollments: { where: { childId: { in: childIds } } }, _count: { select: { enrollments: true } } }, orderBy: { scheduledAt: "asc" } });
  return (
    <AppShell
      title="الأنشطة والفعاليات"
      subtitle="سجل أطفالك في الأنشطة المتاحة."
    >
      {activities.length === 0 ? (
        <div className="empty-state">لا توجد فعاليات قادمة.</div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <article key={activity.id} className="card p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{activity.title}</h2>
                  <p className="text-sm text-slate-500">{activity.type} • {activity.location || "بدون مكان"} • {activity.scheduledAt.toLocaleString("ar-EG")}</p>
                </div>
                <span className="badge badge-blue">{activity._count.enrollments}/{activity.capacity}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{activity.description || ""}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {children.map((child) => {
                  const enrollment = activity.enrollments.find((item) => item.childId === child.childId);
                  return enrollment ? (
                    <span key={child.childId} className="badge badge-green">{child.child.name}: {enrollment.status === "WAITLISTED" ? "قائمة انتظار" : "مسجل"}</span>
                  ) : (
                    <form key={child.childId} action={enrollChildActivity.bind(null, activity.id, child.childId)}>
                      <button type="submit" className="btn btn-outline btn-sm">تسجيل {child.child.name}</button>
                    </form>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
