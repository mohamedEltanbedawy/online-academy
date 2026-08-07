import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PaymobCheckout } from "@/components/paymob-checkout";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OnlinePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await requireRole("STUDENT");
  const { id } = await params;
  const cls = await prisma.class.findFirst({ where: { id, status: "ACTIVE" }, select: { id: true, name: true, pricePerHour: true } });
  if (!cls) notFound();
  return (
    <AppShell
      title="الدفع الإلكتروني"
      subtitle={`${cls.name} — ${cls.pricePerHour.toFixed(2)} ج.م`}
    >
      <p className="mb-4 text-xs text-slate-500">الحساب: {student.email}</p>
      <section className="card p-5">
        <PaymobCheckout classId={cls.id} />
      </section>
    </AppShell>
  );
}
