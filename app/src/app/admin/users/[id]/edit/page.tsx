import { notFound } from "next/navigation";
import { AdminEditUserForm } from "@/components/admin-edit-user-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, phone: true, role: true } });
  if (!user) notFound();
  return (
    <AppShell title="تعديل الحساب" maxWidth="max-w-lg">
      <section className="section-card">
        <AdminEditUserForm user={user} />
      </section>
    </AppShell>
  );
}
