import { notFound } from "next/navigation";
import { EditProgramForm } from "@/components/academy/edit-program-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const program = await prisma.academyProgram.findUnique({ where: { id }, select: { id: true, title: true, description: true, objectives: true } });
  if (!program) notFound();
  return (
    <AppShell title="تعديل البرنامج" maxWidth="max-w-2xl">
      <section className="section-card">
        <h2 className="section-title">تعديل البرنامج</h2>
        <div className="mt-4">
          <EditProgramForm program={program} />
        </div>
      </section>
    </AppShell>
  );
}
