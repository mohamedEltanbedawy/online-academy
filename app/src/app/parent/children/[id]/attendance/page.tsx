import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParentChildAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const parent = await requireRole("PARENT");
  const { id } = await params;
  const link = await prisma.childGuardian.findUnique({ where: { childId_guardianId: { childId: id, guardianId: parent.id } }, include: { child: { include: { attendance: { orderBy: { date: "desc" }, take: 60 }, activities: { include: { activity: true }, orderBy: { createdAt: "desc" } } } } } });
  if (!link) notFound();
  return (
    <AppShell
      title={`متابعة ${link.child.name}`}
      subtitle="الحضور والأنشطة المسجل فيها."
    >
      <div className="space-y-6">
        <section className="section-card">
          <h2 className="section-title">سجل الحضور</h2>
          <div className="mt-3 space-y-2">
            {link.child.attendance.length === 0 ? (
              <p className="text-sm text-slate-500">لا يوجد حضور مسجل.</p>
            ) : link.child.attendance.map((item) => (
              <p key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                {item.date.toLocaleDateString("ar-EG")} — {item.mode === "ONSITE" ? "حضوري" : "أونلاين"} — {item.status === "PRESENT" ? "حاضر" : item.status === "LATE" ? "متأخر" : "غائب"}
              </p>
            ))}
          </div>
        </section>
        <section className="section-card">
          <h2 className="section-title">الأنشطة</h2>
          <div className="mt-3 space-y-2">
            {link.child.activities.length === 0 ? (
              <p className="text-sm text-slate-500">لا يوجد تسجيل في أنشطة.</p>
            ) : link.child.activities.map((item) => (
              <p key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                {item.activity.title} — {item.status === "WAITLISTED" ? "قائمة انتظار" : item.status === "REGISTERED" ? "مسجل" : "ملغي"}
              </p>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
