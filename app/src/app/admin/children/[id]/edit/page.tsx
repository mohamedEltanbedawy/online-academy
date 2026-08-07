import { notFound } from "next/navigation";
import { EditChildForm } from "@/components/academy/edit-child-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditChildPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const child = await prisma.child.findUnique({ where: { id }, select: { id: true, name: true, stage: true, schoolGrade: true, notes: true, medicalNotes: true } });
  if (!child) notFound();
  return (
    <AppShell title="تعديل ملف الطفل" maxWidth="max-w-2xl">
      <section className="section-card">
        <EditChildForm child={child} />
      </section>
    </AppShell>
  );
}
