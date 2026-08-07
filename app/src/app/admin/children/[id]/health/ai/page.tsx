import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AiHealthEntry } from "@/components/health/ai-health-entry";

export const dynamic = "force-dynamic";

export default async function ChildHealthAiPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("health:manage");
  const { id } = await params;
  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) notFound();

  return (
    <AppShell
      title={`إدخال صحي بالذكاء الاصطناعي — ${child.name}`}
      subtitle="الصق نصًا حرًا أو ارفع صورة (شهادة تطعيم، كارت متابعة، ورق طبي) وسيُستخرج البيانات تلقائيًا."
      maxWidth="max-w-4xl"
    >
      <div className="mb-6 flex gap-2">
        <Link href={`/admin/children/${child.id}/health`} className="btn-outline">عودة للملف الصحي</Link>
      </div>
      <section className="section-card">
        <h2 className="section-title">الإدخال الذكي</h2>
        <div className="mt-4">
          <AiHealthEntry childId={child.id} />
        </div>
      </section>
    </AppShell>
  );
}
