import Link from "next/link";
import { setClassArchived } from "@/app/actions/admin";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  await requireRole("ADMIN");
  const classes = await prisma.class.findMany({ include: { teacher: { select: { name: true } }, _count: { select: { enrollments: true, homeworks: true, recordings: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <AppShell
      title="إدارة الفصول"
      subtitle="أرشفة الفصل تمنع التسجيلات الجديدة والانضمام إليه."
      actions={
        <Link href="/admin/classes/new" className="btn btn-primary btn-sm">
          + فصل جديد
        </Link>
      }
    >
      <div className="space-y-3">
        {classes.map((cls) => (
          <article key={cls.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h2 className="font-bold text-slate-900">{cls.name}</h2>
              <p className="text-sm text-slate-500">{cls.subject} • المدرس: {cls.teacher.name} • {cls._count.enrollments} اشتراك • {cls._count.homeworks} واجب • {cls._count.recordings} تسجيل</p>
              <p className="mt-1 text-xs">
                <span className={cls.status === "ACTIVE" ? "badge badge-green" : "badge badge-red"}>
                  {cls.status === "ACTIVE" ? "نشط" : "مؤرشف"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/admin/classes/${cls.id}/edit`} className="font-semibold text-blue-600 hover:underline">
                تعديل
              </Link>
              <form action={setClassArchived.bind(null, cls.id, cls.status === "ACTIVE")}>
                <button type="submit" className={cls.status === "ACTIVE" ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-emerald"}>
                  {cls.status === "ACTIVE" ? "أرشفة الفصل" : "إرجاع الفصل"}
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
