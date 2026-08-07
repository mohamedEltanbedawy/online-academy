import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AiProviderForm } from "@/components/ai-provider-form";

export const dynamic = "force-dynamic";

export default async function AdminAiEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const provider = await prisma.aiProvider.findUnique({ where: { id } });
  if (!provider) {
    return (
      <AppShell title="الموديل غير موجود" subtitle="لا يوجد موديل بهذا المعرّف.">
        <div className="empty-state">الموديل غير موجود — عد لصفحة الموديلات.</div>
      </AppShell>
    );
  }
  return (
    <AppShell title={`تعديل ${provider.name}`} subtitle="عدّل إعدادات الموديل ثم احفظ.">
      <section className="section-card max-w-2xl">
        <div className="mt-2"><AiProviderForm provider={provider} /></div>
      </section>
    </AppShell>
  );
}
