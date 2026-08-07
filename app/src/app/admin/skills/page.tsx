import { toggleSkillActive } from "@/app/actions/academy";
import { SkillCreateForm } from "@/components/skill-create-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  await requireRole("ADMIN");
  const skills = await prisma.skill.findMany({ include: { _count: { select: { assessments: true } } }, orderBy: [{ category: "asc" }, { name: "asc" }] });
  const categories = [...new Set(skills.map((skill) => skill.category))];
  return (
    <AppShell
      title="مهارات التقييم"
      subtitle="تُستخدم في تقييم تطور كل طفل."
    >
      <section className="section-card">
        <h2 className="section-title">مهارة جديدة</h2>
        <div className="mt-4">
          <SkillCreateForm />
        </div>
      </section>

      {categories.map((category) => (
        <section key={category} className="section-card mt-6">
          <h2 className="section-title">{category}</h2>
          <div className="mt-3 space-y-2">
            {skills.filter((skill) => skill.category === category).map((skill) => (
              <div key={skill.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                <div>
                  <span className="font-semibold text-slate-800">{skill.name}</span>
                  <span className="mr-2 text-xs text-slate-500">{skill.description}</span>
                  <span className="mr-2 text-xs text-slate-400">{skill._count.assessments} تقييم</span>
                  <span className={`mr-2 ${skill.active ? "badge badge-green" : "badge badge-red"}`}>
                    {skill.active ? "نشطة" : "موقوفة"}
                  </span>
                </div>
                <form action={toggleSkillActive.bind(null, skill.id)}>
                  <button type="submit" className={skill.active ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-emerald"}>
                    {skill.active ? "إيقاف" : "تفعيل"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
