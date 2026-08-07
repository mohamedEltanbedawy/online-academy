import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const staff = await requireRole("STAFF", "TEACHER");
  const children = await prisma.child.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 200 });
  return (
    <AppShell
      title={`لوحة الأخصائي — أهلاً ${staff.name}`}
      subtitle="تابع الحضور والمهارات والتقييمات."
    >
      <h2 className="section-title mb-4">الأطفال النشطون ({children.length})</h2>
      {children.length === 0 ? (
        <div className="empty-state">لا يوجد أطفال نشطون حاليًا.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link key={child.id} href={`/staff/children/${child.id}`} className="card p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <h2 className="font-bold text-slate-900">{child.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{child.stage || "مرحلة غير محددة"}</p>
              <span className="mt-3 inline-block text-sm font-bold text-blue-600">فتح المتابعة ←</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
