import { AppShell } from "@/components/app-shell";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ParentBillingPage() {
  const parent = await requireRole("PARENT");
  const invoices = await prisma.nurseryInvoice.findMany({ where: { child: { guardians: { some: { guardianId: parent.id } } } }, include: { child: { select: { name: true } } }, orderBy: { dueDate: "desc" } });
  return (
    <AppShell
      title="فواتير الحضانة"
      subtitle="حالة سداد أطفالك."
    >
      {invoices.length === 0 ? (
        <div className="empty-state">لا توجد فواتير.</div>
      ) : (
        <div className="space-y-3">
          {invoices.map((item) => (
            <div key={item.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <span className="text-sm text-slate-600">{item.invoiceNumber} — {item.child.name}</span>
              <span className="flex items-center gap-2 font-bold">
                {formatMoney(item.amount)} ج.م
                <span className={`badge ${item.status === "PAID" ? "badge-green" : "badge-amber"}`}>{item.status === "PAID" ? "مدفوعة" : "مطلوبة"}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
