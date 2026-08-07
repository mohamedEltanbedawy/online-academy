import { renameRecording, toggleRecordingActive } from "@/app/actions/admin";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminRecordingsPage() {
  await requireRole("ADMIN");
  const recordings = await prisma.recording.findMany({ include: { class: { select: { name: true } } }, orderBy: { startedAt: "desc" }, take: 200 });
  return (
    <AppShell
      title="إدارة التسجيلات"
      subtitle="التسجيلات محفوظة للمكتبة والتاريخ."
    >
      <div className="space-y-3">
        {recordings.map((item) => (
          <article key={item.id} className="card p-5">
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{item.title}</h2>
                <p className="text-sm text-slate-500">{item.class.name} • {item.status}</p>
              </div>
              <div className="text-left">
                <span className={item.active ? "badge badge-green" : "badge badge-red"}>
                  {item.active ? "ظاهر للطلاب" : "مخفي"}
                </span>
                <p className="mt-1 text-xs text-slate-500">{item.startedAt.toLocaleString("ar-EG")}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <form action={renameRecording} className="flex flex-1 gap-2">
                <input type="hidden" name="id" value={item.id} />
                <input name="title" defaultValue={item.title} className="input" />
                <button type="submit" className="btn btn-primary btn-sm">تعديل العنوان</button>
              </form>
              <form action={toggleRecordingActive.bind(null, item.id)}>
                <button type="submit" className={item.active ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-emerald"}>
                  {item.active ? "إخفاء من الطلاب" : "إظهار للطلاب"}
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
