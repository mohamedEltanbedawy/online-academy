import { AdminCreateChildForm } from "@/components/admin-create-child-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminNewChildPage() {
  await requireRole("ADMIN");
  const guardians = await prisma.user.findMany({ where: { role: "PARENT" }, select: { id: true, name: true, phone: true }, orderBy: { name: "asc" } });
  return (
    <AppShell title="إضافة طفل جديد" subtitle="البرنامج يبدأ من سن سنتين وحتى 14 سنة." maxWidth="max-w-lg">
      <section className="section-card">
        <AdminCreateChildForm guardianOptions={guardians} />
      </section>
    </AppShell>
  );
}
