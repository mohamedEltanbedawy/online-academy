import Link from "next/link";
import { toggleAcademyProgramActive } from "@/app/actions/academy";
import { ProgramCreateForm, StageCreateForm, StageEditForm } from "@/components/admin-program-forms";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage() {
  await requireRole("ADMIN");
  const stages = await prisma.academyStage.findMany({ include: { programs: { orderBy: { version: "desc" } } }, orderBy: { ageMin: "asc" } });
  return (
    <AppShell
      title="المراحل والبرامج"
      subtitle="قوالب الحضانة والأكاديمية من سن سنتين حتى 14 سنة."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="section-card">
          <h2 className="section-title">مرحلة جديدة</h2>
          <div className="mt-4">
            <StageCreateForm />
          </div>
        </div>
        <div className="section-card">
          <h2 className="section-title">برنامج جديد</h2>
          <div className="mt-4">
            <ProgramCreateForm stages={stages.map((stage) => ({ id: stage.id, name: stage.name }))} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {stages.map((stage) => (
          <article key={stage.id} className="card p-5">
            <div className="flex justify-between">
              <h2 className="font-bold text-slate-900">{stage.name}</h2>
              <span className="text-sm text-slate-500">{stage.ageMin}-{stage.ageMax} سنة</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{stage.description}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-semibold text-blue-600">تعديل المرحلة</summary>
              <StageEditForm stage={{ id: stage.id, name: stage.name, ageMin: stage.ageMin, ageMax: stage.ageMax, description: stage.description }} />
            </details>
            {stage.programs.map((program) => (
              <div key={program.id} className="mt-4 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {program.title} <span className="text-xs text-slate-500">نسخة {program.version}</span>{" "}
                      <span className={program.active ? "badge badge-green" : "badge badge-red"}>
                        {program.active ? "نشط" : "موقوف"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{program.objectives}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Link href={`/admin/programs/${program.id}/edit`} className="font-semibold text-blue-600 hover:underline">
                      تعديل
                    </Link>
                    <form action={toggleAcademyProgramActive.bind(null, program.id)}>
                      <button type="submit" className={program.active ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-emerald"}>
                        {program.active ? "إيقاف" : "تفعيل"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
