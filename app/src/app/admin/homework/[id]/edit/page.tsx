import { notFound } from "next/navigation";
import { AdminEditHomeworkForm } from "@/components/admin-edit-homework-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminEditHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const item = await prisma.homework.findUnique({ where: { id }, select: { id: true, title: true, instructions: true, maxScore: true, dueAt: true } });
  if (!item) notFound();
  const dueAt = item.dueAt ? new Date(item.dueAt.getTime() - item.dueAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  return (
    <AppShell title="تعديل الواجب" maxWidth="max-w-2xl">
      <section className="section-card">
        <h2 className="section-title">تعديل الواجب</h2>
        <div className="mt-4">
          <AdminEditHomeworkForm homework={{ ...item, dueAt }} />
        </div>
      </section>
    </AppShell>
  );
}
