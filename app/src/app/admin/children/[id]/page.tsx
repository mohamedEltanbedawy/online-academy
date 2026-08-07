import { notFound } from "next/navigation";
import Link from "next/link";
import { AssessmentForm } from "@/components/academy/assessment-form";
import { AssignProgramForm } from "@/components/academy/assign-program-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const [child, programs, skills] = await Promise.all([
    prisma.child.findUnique({ where: { id }, include: { guardians: { include: { guardian: { select: { name: true, phone: true } } } }, programs: { where: { active: true }, include: { program: { include: { stage: true } } } }, assessments: { include: { skill: true, assessor: { select: { name: true } } }, orderBy: { assessedAt: "desc" } } } }),
    prisma.academyProgram.findMany({ where: { active: true }, include: { stage: true }, orderBy: { createdAt: "desc" } }),
    prisma.skill.findMany({ where: { active: true }, orderBy: { category: "asc" } }),
  ]);
  if (!child) notFound();
  return (
    <AppShell
      title={`ملف ${child.name}`}
      subtitle={`${child.stage || "مرحلة غير محددة"} • ولي الأمر: ${child.guardians[0]?.guardian.name ?? "-"}`}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/admin/children/${child.id}/attendance`} className="btn-outline">الحضور</Link>
        <Link href={`/admin/children/${child.id}/health`} className="btn-outline">الملف الصحي</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="section-card">
          <h2 className="section-title">البرنامج المخصص</h2>
          {child.programs.length > 0 && (
            <div className="my-3 rounded-xl bg-blue-50 p-3 text-sm">
              <p className="font-bold">{child.programs[0].program.title}</p>
              <p className="mt-1">{child.programs[0].customPlan || "لا توجد تعديلات مخصصة"}</p>
            </div>
          )}
          <AssignProgramForm childId={child.id} programs={programs.map((program) => ({ id: program.id, label: `${program.title} — ${program.stage.name}` }))} />
        </section>

        <section className="section-card">
          <h2 className="section-title">تسجيل تقييم مهارة</h2>
          <div className="mt-3">
            <AssessmentForm childId={child.id} skills={skills.map((skill) => ({ id: skill.id, label: `${skill.name} — ${skill.category}` }))} />
          </div>
        </section>
      </div>

      <section className="section-card mt-6">
        <h2 className="section-title">سجل التقييمات</h2>
        {child.assessments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">لا توجد تقييمات.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {child.assessments.map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-semibold">{assessment.skill.name}</p>
                  <p className="text-xs text-slate-500">{assessment.assessor.name} • {assessment.notes || "بدون ملاحظات"}</p>
                </div>
                <span className="badge badge-blue">{assessment.score}/100</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
