import { notFound } from "next/navigation";
import { AttendanceForm } from "@/components/academy/attendance-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ChildAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const child = await prisma.child.findUnique({ where: { id }, include: { attendance: { orderBy: { date: "desc" }, take: 60 } } });
  if (!child) notFound();
  return (
    <AppShell title={`حضور ${child.name}`} subtitle="الحضور الحضوري والأونلاين." maxWidth="max-w-4xl">
      <section className="section-card">
        <h2 className="section-title">تسجيل حضور</h2>
        <div className="mt-4">
          <AttendanceForm childId={child.id} />
        </div>
      </section>

      <section className="section-card mt-6">
        <h2 className="section-title">السجل</h2>
        <div className="mt-3 space-y-2">
          {child.attendance.map((item) => (
            <p key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              {item.date.toLocaleDateString("ar-EG")} — {item.mode === "ONSITE" ? "حضوري" : "أونلاين"} — {item.status === "PRESENT" ? "حاضر" : item.status === "LATE" ? "متأخر" : "غائب"}{item.note ? ` — ${item.note}` : ""}
            </p>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
