import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AddChildForm } from "@/components/parent/add-child-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParentPage() {
  const parent = await requireRole("PARENT");
  const links = await prisma.childGuardian.findMany({ where: { guardianId: parent.id }, include: { child: true }, orderBy: { child: { createdAt: "desc" } } });
  return (
    <AppShell
      title={`حضانة وأكاديمية ${parent.name}`}
      subtitle="ملفات أطفالك وبرامجهم من هنا."
      actions={
        <>
          <Link href="/parent/activities" className="btn-outline">الأنشطة</Link>
          <Link href="/parent/billing" className="btn-outline">الفواتير</Link>
        </>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.length === 0 ? (
          <div className="empty-state sm:col-span-2 lg:col-span-3">أضف أول طفل للبدء.</div>
        ) : (
          links.map(({ child }) => (
            <article key={child.id} className="card p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <h2 className="text-lg font-bold text-slate-900">{child.name}</h2>
              <p className="mt-1 text-sm text-slate-600">الميلاد: {child.birthDate.toLocaleDateString("ar-EG")}</p>
              <p className="mt-1 text-sm text-slate-600">المرحلة: {child.stage || "لم تحدد بعد"}</p>
              <Link href={`/parent/children/${child.id}`} className="mt-4 inline-block text-sm font-bold text-blue-600 hover:underline">فتح ملف الطفل ←</Link>
            </article>
          ))
        )}
      </section>
      <section className="section-card mt-8">
        <h2 className="section-title">إضافة طفل</h2>
        <div className="mt-4 max-w-2xl"><AddChildForm /></div>
      </section>
    </AppShell>
  );
}
