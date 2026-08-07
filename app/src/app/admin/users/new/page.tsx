import { AdminCreateUserForm } from "@/components/admin-create-user-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminNewUserPage() {
  await requireRole("ADMIN");
  return (
    <AppShell title="حساب جديد" subtitle="أنشئ حسابًا لأي دور مباشرة." maxWidth="max-w-lg">
      <section className="section-card">
        <AdminCreateUserForm />
      </section>
    </AppShell>
  );
}
