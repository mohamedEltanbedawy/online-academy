import Link from "next/link";
import { toggleChildActive } from "@/app/actions/academy";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminChildrenPage() {
  await requireRole("ADMIN");
  const children = await prisma.child.findMany({ include: { guardians: { include: { guardian: { select: { name: true, phone: true } } } }, _count: { select: { assessments: true, programs: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <AppShell
      title="إدارة الأطفال"
      subtitle="ملفات الأطفال والبرامج والتقييمات."
      actions={
        <Link href="/admin/children/new" className="btn btn-primary btn-sm">
          + طفل جديد
        </Link>
      }
    >
      {children.length === 0 ? (
        <div className="empty-state">لا يوجد أطفال بعد.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <article key={child.id} className="card flex flex-col gap-3 p-5">
              <div>
                <h2 className="font-bold text-slate-900">{child.name}</h2>
                <p className="mt-1 text-sm text-slate-600">ولي الأمر: {child.guardians[0]?.guardian.name ?? "-"}</p>
              </div>
              <p className="text-xs text-slate-500">
                برامج: {child._count.programs} • تقييمات: {child._count.assessments}
              </p>
              <div>
                <span className={child.active ? "badge badge-green" : "badge badge-red"}>
                  {child.active ? "نشط" : "موقوف"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <Link href={`/admin/children/${child.id}`} className="font-semibold text-blue-600 hover:underline">
                  فتح الملف
                </Link>
                <Link href={`/admin/children/${child.id}/edit`} className="font-semibold text-slate-600 hover:underline">
                  تعديل
                </Link>
                <form action={toggleChildActive.bind(null, child.id)}>
                  <button type="submit" className={child.active ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-emerald"}>
                    {child.active ? "إيقاف" : "تفعيل"}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
