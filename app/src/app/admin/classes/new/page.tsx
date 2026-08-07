import { AdminCreateClassForm } from "@/components/admin-create-class-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminNewClassPage() {
  await requireRole("ADMIN");
  const teachers = await prisma.user.findMany({ where: { role: "TEACHER", active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <AppShell title="فصل جديد" subtitle="يتم إنشاؤه باسم المدرس المختار مع كود دعوة تلقائي." maxWidth="max-w-lg">
      <section className="section-card">
        <AdminCreateClassForm teacherOptions={teachers} />
      </section>
    </AppShell>
  );
}
