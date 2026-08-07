import { notFound } from "next/navigation";
import { EditNurserySubscriptionForm } from "@/components/edit-nursery-subscription-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditNurserySubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const subscription = await prisma.nurserySubscription.findUnique({ where: { id }, select: { id: true, planName: true, monthlyAmount: true, discount: true } });
  if (!subscription) notFound();
  return (
    <AppShell title="تعديل الاشتراك" maxWidth="max-w-xl">
      <section className="section-card">
        <h2 className="section-title">تعديل الاشتراك</h2>
        <div className="mt-4">
          <EditNurserySubscriptionForm subscription={{ ...subscription, monthlyAmount: subscription.monthlyAmount.toNumber(), discount: subscription.discount.toNumber() }} />
        </div>
      </section>
    </AppShell>
  );
}
