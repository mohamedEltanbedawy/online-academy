import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getAllRoles, getAllPermissions } from "@/lib/permissions";
import { saveRolePermissions, createRole, deleteRole, createPermission } from "@/app/actions/permissions";

export const dynamic = "force-dynamic";

export default async function AdminPermissionsPage() {
  await requireRole("ADMIN");
  const roles = await getAllRoles();
  const permissionGroups = await getAllPermissions();

  return (
    <AppShell
      title="الصلاحيات والأدوار"
      subtitle="تحكّم في كل صلاحية في النظام — لكل دور ولكل مستخدم."
    >
      <section className="section-card">
        <h2 className="section-title">دور جديد</h2>
        <form action={createRole} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">الاسم التقني (إنجليزي)</label>
            <input id="name" name="name" required dir="ltr" placeholder="MANAGER" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="label" className="mb-1 block text-sm font-medium text-slate-700">الاسم العربي</label>
            <input id="label" name="label" required placeholder="مدير" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="btn-primary">إضافة الدور</button>
        </form>
      </section>

      <section className="section-card mt-6">
        <h2 className="section-title">صلاحية جديدة (لموديول جديد)</h2>
        <form action={createPermission} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-700">الكود</label>
            <input id="code" name="code" required dir="ltr" placeholder="module:action" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="label" className="mb-1 block text-sm font-medium text-slate-700">الوصف</label>
            <input id="label" name="label" required placeholder="وصف الصلاحية" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="module" className="mb-1 block text-sm font-medium text-slate-700">الوحدة</label>
            <input id="module" name="module" required dir="ltr" placeholder="reports" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          </div>
          <button type="submit" className="btn-primary">إضافة الصلاحية</button>
        </form>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {roles.map((role) => (
          <section key={role.id} className="section-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">
                {role.label}
                <span className="badge badge-blue mr-2">{role.name}</span>
                {role.isSystem && <span className="badge badge-slate">نظامي</span>}
                <span className="badge badge-slate">{role.users.length} مستخدم</span>
              </h2>
              {!role.isSystem && (
                <form action={deleteRole.bind(null, role.id)}>
                  <button type="submit" className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100">حذف</button>
                </form>
              )}
            </div>
            <form action={saveRolePermissions.bind(null, role.id)} className="mt-4 space-y-3">
              {permissionGroups.map(([module, perms]) => (
                <fieldset key={module}>
                  <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">{module}</legend>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          name={`perm:${p.code}`}
                          defaultChecked={role.permissions.some((rp) => rp.permissionId === p.id)}
                          className="size-4"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <button type="submit" className="btn-primary">حفظ صلاحيات الدور</button>
            </form>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
