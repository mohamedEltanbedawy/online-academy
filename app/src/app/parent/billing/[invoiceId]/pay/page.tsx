import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PaymobCheckout } from "@/components/paymob-checkout";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NurseryInvoicePayPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const parent = await requireRole("PARENT");
  const { invoiceId } = await params;
  const invoice = await prisma.nurseryInvoice.findFirst({ where: { id: invoiceId, child: { guardians: { some: { guardianId: parent.id } } } }, include: { child: { select: { name: true } } } });
  if (!invoice || invoice.status === "PAID") notFound();
  return (
    <AppShell
      title="سداد فاتورة الحضانة"
      subtitle={`${invoice.child.name} — ${formatMoney(invoice.amount)} ج.م`}
    >
      <section className="card p-5">
        <PaymobCheckout invoiceId={invoice.id} />
      </section>
    </AppShell>
  );
}
