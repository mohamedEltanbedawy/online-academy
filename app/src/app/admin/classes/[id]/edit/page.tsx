import { notFound } from "next/navigation";
import { AdminEditClassForm } from "@/components/admin-edit-class-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminEditClassPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const cls = await prisma.class.findUnique({ where: { id }, select: { id: true, name: true, subject: true, description: true, pricePerHour: true, platformPercent: true, fixedFee: true } });
  if (!cls) notFound();
  return (
    <AppShell title="تعديل الفصل" maxWidth="max-w-2xl">
      <section className="section-card">
        <AdminEditClassForm cls={{ ...cls, pricePerHour: cls.pricePerHour.toNumber(), platformPercent: cls.platformPercent.toNumber(), fixedFee: cls.fixedFee.toNumber() }} />
      </section>
    </AppShell>
  );
}
