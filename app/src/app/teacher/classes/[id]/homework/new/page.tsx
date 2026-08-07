import { notFound } from "next/navigation";
import { CreateHomeworkForm } from "@/components/teacher/create-homework-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function NewHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireRole("TEACHER");
  const { id } = await params;
  const cls = await prisma.class.findFirst({ where: { id, teacherId: teacher.id }, select: { id: true, name: true } });
  if (!cls) notFound();
  return (
    <AppShell title={`واجب جديد — ${cls.name}`} maxWidth="max-w-2xl">
      <section className="section-card">
        <CreateHomeworkForm classId={cls.id} />
      </section>
    </AppShell>
  );
}
