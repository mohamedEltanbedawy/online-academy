import Link from "next/link";
import { toggleHomeworkActive } from "@/app/actions/admin";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHomeworkPage() {
  await requireRole("ADMIN");
  const homework = await prisma.homework.findMany({ include: { class: { select: { name: true } }, _count: { select: { submissions: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <AppShell
      title="إدارة الواجبات"
      subtitle="تعديل الواجبات ومتابعة حالتها."
    >
      <div className="space-y-3">
        {homework.map((item) => (
          <article key={item.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="font-bold text-slate-900">{item.title}</h2>
              <p className="text-sm text-slate-500">{item.class.name} • {item._count.submissions} حل • الدرجة {item.maxScore}</p>
              <span className={item.active ? "badge badge-green" : "badge badge-red"}>
                {item.active ? "نشط" : "موقوف"}
              </span>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href={`/admin/homework/${item.id}/edit`} className="btn btn-sm btn-outline">
                تعديل
              </Link>
              <form action={toggleHomeworkActive.bind(null, item.id)}>
                <button type="submit" className={item.active ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-emerald"}>
                  {item.active ? "إيقاف" : "تفعيل"}
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
