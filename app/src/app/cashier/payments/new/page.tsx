import { AppShell } from "@/components/app-shell";
import { CashierPaymentForm } from "@/components/cashier-payment-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewCashierPaymentPage() {
  await requireRole("CASHIER");
  const classes = await prisma.class.findMany({ where: { status: "ACTIVE" }, include: { teacher: { select: { name: true } } }, orderBy: { name: "asc" } });
  return (
    <AppShell
      title="تسجيل دفعة جديدة"
      subtitle="المبلغ بالجنيه والقروش، وسيتم تفعيل الطالب فورًا."
    >
      <section className="section-card">
        <CashierPaymentForm classes={classes.map((item) => ({ id: item.id, label: `${item.name} — ${item.teacher.name}` }))} />
      </section>
    </AppShell>
  );
}
