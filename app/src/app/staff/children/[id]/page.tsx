import Link from "next/link";
import { notFound } from "next/navigation";
import { AssessmentForm } from "@/components/academy/assessment-form";
import { AttendanceForm } from "@/components/academy/attendance-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StaffChildPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("STAFF", "TEACHER");
  const { id } = await params;
  const [child, skills] = await Promise.all([prisma.child.findUnique({ where: { id }, include: { assessments: { include: { skill: true, assessor: { select: { name: true } } }, orderBy: { assessedAt: "desc" } }, attendance: { orderBy: { date: "desc" }, take: 20 } } }), prisma.skill.findMany({ where: { active: true }, orderBy: { category: "asc" } })]);
  if (!child) notFound();
  return <main className="flex-1 p-6"><div className="mx-auto max-w-4xl space-y-6"><header className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">متابعة {child.name}</h1><p className="text-slate-600">{child.stage || "مرحلة غير محددة"}</p></div><Link href="/staff" className="text-sm text-slate-500 hover:underline">→ الأطفال</Link></header><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">تقييم مهارة</h2><div className="mt-4"><AssessmentForm childId={child.id} skills={skills.map((skill) => ({ id: skill.id, label: `${skill.name} — ${skill.category}` }))} /></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">تسجيل حضور</h2><div className="mt-4"><AttendanceForm childId={child.id} /></div></section></div><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">آخر التقييمات</h2><div className="mt-3 space-y-2">{child.assessments.map((item) => <p key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">{item.skill.name}: {item.score}/100 — {item.assessor.name}</p>)}</div></section></div></main>;
}
