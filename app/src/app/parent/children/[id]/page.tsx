import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const parent = await requireRole("PARENT");
  const { id } = await params;
  const link = await prisma.childGuardian.findUnique({ where: { childId_guardianId: { childId: id, guardianId: parent.id } }, include: { child: { include: { assessments: { include: { skill: true, assessor: { select: { name: true } } }, orderBy: { assessedAt: "desc" }, take: 30 }, attendance: { orderBy: { date: "desc" }, take: 30 }, activities: { include: { activity: true }, orderBy: { createdAt: "desc" }, take: 20 } } } } });
  if (!link) notFound();
  const child = link.child;
  return (
    <AppShell
      title={`ملف ${child.name}`}
      subtitle="ملف الحضانة والأكاديمية."
    >
      <div className="space-y-6">
        <section className="section-card">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <dt className="text-slate-500">تاريخ الميلاد</dt>
              <dd className="font-semibold">{child.birthDate.toLocaleDateString("ar-EG")}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <dt className="text-slate-500">المرحلة</dt>
              <dd className="font-semibold">{child.stage || "لم تحدد"}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <dt className="text-slate-500">الصف الدراسي</dt>
              <dd className="font-semibold">{child.schoolGrade || "لم يحدد"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ملاحظات تربوية</dt>
              <dd className="mt-1 whitespace-pre-wrap font-semibold">{child.notes || "لا توجد"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ملاحظات طبية</dt>
              <dd className="mt-1 whitespace-pre-wrap font-semibold">{child.medicalNotes || "لا توجد"}</dd>
            </div>
          </dl>
        </section>
        <section className="section-card">
          <h2 className="section-title">آخر تقييمات المهارات</h2>
          {child.assessments.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">لم يتم تسجيل تقييمات بعد.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {child.assessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-semibold">{assessment.skill.name}</p>
                    <p className="text-xs text-slate-500">{assessment.skill.category} • بواسطة {assessment.assessor.name}</p>
                  </div>
                  <span className="font-bold text-blue-700">{assessment.score}/100</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
