import { notFound } from "next/navigation";
import { EditActivityForm } from "@/components/edit-activity-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) notFound();
  const scheduledAt = new Date(activity.scheduledAt.getTime() - activity.scheduledAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return (
    <AppShell title="تعديل الفعالية" maxWidth="max-w-2xl">
      <section className="section-card">
        <h2 className="section-title">تعديل الفعالية</h2>
        <div className="mt-4">
          <EditActivityForm activity={{ ...activity, scheduledAt }} />
        </div>
      </section>
    </AppShell>
  );
}
