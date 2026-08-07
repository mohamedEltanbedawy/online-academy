import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMyFamilyMemberships } from "@/lib/family";

export const dynamic = "force-dynamic";

function toAge(d: Date) {
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

export default async function FamilyMembersPage() {
  await requireUser();
  const memberships = await getMyFamilyMemberships();
  const families = memberships.map((m) => m.family);

  const familyPersonIds = [...new Set(families.flatMap((f) => f.members.map((x) => x.person.id)))];

  const relationships = familyPersonIds.length > 0
    ? await prisma.relationship.findMany({
        where: { fromPersonId: { in: familyPersonIds } },
        include: { toPerson: { select: { id: true, fullName: true } } },
      })
    : [];

  return (
    <AppShell
      title="أفراد العائلة"
      subtitle="كل أفراد عائلاتك في مكان واحد."
    >
      {families.length === 0 ? (
        <div className="empty-state">لسه مفيش عائلة مرتبطة بحسابك.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {families.map((family) => (
            <section key={family.id} className="section-card">
              <h2 className="section-title">
                عائلة {family.name}
                <span className="badge badge-blue mr-2">{family.members.length} فرد</span>
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                رب العائلة: <span className="font-bold text-slate-700">{family.headPerson?.fullName ?? "—"}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {family.members.map((member) => (
                  <li key={member.person.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-black text-white">
                        {member.person.fullName.trim().charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {member.person.fullName}
                          {member.isPrimary && <span className="badge badge-green mr-2">ولي الأمر الأساسي</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          {member.role}
                          {member.person.birthDate ? ` — ${toAge(member.person.birthDate)} سنة` : ""}
                          {member.person.gender === "MALE" ? " — ذكر" : member.person.gender === "FEMALE" ? " — أنثى" : ""}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {relationships.length > 0 && (
                <>
                  <h3 className="mt-5 text-sm font-bold text-slate-700">العلاقات بين الأفراد</h3>
                  <ul className="mt-2 space-y-1.5">
                    {relationships
                      .filter((r) => family.members.some((x) => x.person.id === r.fromPersonId))
                      .map((r) => {
                        const labels: Record<string, string> = {
                          GUARDIAN_OF: "ولي أمر لـ",
                          SIBLING: "أخ/أخت لـ",
                          PARENT_OF: "والد/والدة لـ",
                          SPOUSE: "زوج/زوجة لـ",
                          GRANDPARENT_OF: "جد/جدة لـ",
                          RELATIVE: "قريب لـ",
                        };
                        const isSelf = r.fromPersonId === r.toPerson.id;
                        return (
                          <li key={r.id} className="text-sm text-slate-600">
                            {isSelf ? "العلاقة مع النفس" : `${labels[r.type] ?? "على علاقة بـ"} ${r.toPerson.fullName}`}
                            {r.notes ? <span className="text-slate-400"> ({r.notes})</span> : ""}
                          </li>
                        );
                      })}
                  </ul>
                </>
              )}
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
