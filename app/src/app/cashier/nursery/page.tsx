import { AppShell } from "@/components/app-shell";
import { NurseryInvoicePaymentForm } from "@/components/nursery-invoice-payment-form";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CashierNurseryInvoicesPage() {
  await requireRole("CASHIER");
  const invoices = await prisma.nurseryInvoice.findMany({ where: { status: { not: "PAID" } }, include: { child: { select: { name: true } } }, orderBy: { dueDate: "asc" } });
  return (
    <AppShell
      title="فواتير الحضانة"
      subtitle="سداد الفواتير من منفذ البيع."
    >
      {invoices.length === 0 ? (
        <div className="empty-state">لا توجد فواتير مطلوبة.</div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <article key={invoice.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-bold">{invoice.child.name}</h2>
                <p className="text-sm text-slate-500">{invoice.invoiceNumber} • {formatMoney(invoice.amount)} ج.م • الاستحقاق {invoice.dueDate.toLocaleDateString("ar-EG")}</p>
              </div>
              <NurseryInvoicePaymentForm invoiceId={invoice.id} />
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
