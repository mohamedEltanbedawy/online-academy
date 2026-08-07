import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUserRoles } from "@/app/actions/permissions";

export const dynamic = "force-dynamic";

export default async function AdminUserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return (
      <AppShell title="المستخدم غير موجود">
        <div className="empty-state">المستخدم غير موجود.</div>
      </AppShell>
    );
  }
  const roles = await prisma.accessRole.findMany({ orderBy: { createdAt: "asc" }, include: { users: { where: { userId: user.id } }, permissions: true } });
  const userRoleIds = new Set(roles.flatMap((r) => r.users.map(() => r.id)));

  return (
    <AppShell title={`صلاحيات ${user.name}`} subtitle="اختر الأدوار الممنوحة لهذا المستخدم — الصلاحيات تتجمع من كل الأدوار.">
      <section className="section-card max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="badge badge-blue">{user.email}</span>
          <span className="badge badge-slate">الدور الأساسي: {user.role}</span>
        </div>
        <form action={saveUserRoles.bind(null, user.id)} className="space-y-2">
          {roles.map((role) => (
            <label key={role.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <input type="checkbox" name={`role:${role.name}`} defaultChecked={userRoleIds.has(role.id)} className="size-4" />
              <span className="font-semibold text-slate-800">{role.label}</span>
              <span className="badge badge-slate">{role.name}</span>
              <span className="text-xs text-slate-500">{role.permissions.length} صلاحية</span>
            </label>
          ))}
          <button type="submit" className="btn-primary">حفظ الأدوار</button>
        </form>
      </section>
    </AppShell>
  );
}
