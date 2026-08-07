import Link from "next/link";
import { generateNurseryInvoice, markNurseryInvoicePaid, updateNurserySubscriptionStatus } from "@/app/actions/billing";
import { NurserySubscriptionForm } from "@/components/nursery-subscription-form";
import { AppShell } from "@/components/app-shell";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NurseryBillingPage() {
  await requireRole("ADMIN");
  const [children, subscriptions, invoices] = await Promise.all([
    prisma.child.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.nurserySubscription.findMany({ include: { child: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.nurseryInvoice.findMany({ include: { child: { select: { name: true } } }, orderBy: { dueDate: "desc" }, take: 200 }),
  ]);
  return (
    <AppShell
      title="اشتراكات وفواتير الحضانة"
      subtitle="اشتراك شهري ثابت لكل طفل."
    >
      <section className="section-card">
        <h2 className="section-title">اشتراك جديد</h2>
        <div className="mt-4">
          <NurserySubscriptionForm childOptions={children} />
        </div>
      </section>

      <section className="section-card mt-6">
        <h2 className="section-title">الاشتراكات</h2>
        <div className="mt-3 space-y-2">
          {subscriptions.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm">
              <div>
                <span>{item.child.name} — {item.planName} — {formatMoney(item.monthlyAmount)} ج.م</span>
                <span className={`mr-2 ${item.status === "ACTIVE" ? "badge badge-green" : item.status === "PAUSED" ? "badge badge-amber" : item.status === "CANCELLED" ? "badge badge-red" : "badge badge-slate"}`}>
                  {item.status === "ACTIVE" ? "نشط" : item.status === "PAUSED" ? "موقوف مؤقتًا" : item.status === "CANCELLED" ? "ملغي" : "متأخر"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/nursery/billing/subscriptions/${item.id}/edit`} className="btn btn-sm btn-outline">
                  تعديل
                </Link>
                <form action={generateNurseryInvoice.bind(null, item.id)}>
                  <button type="submit" className="btn btn-sm btn-ghost">توليد فاتورة</button>
                </form>
                {item.status === "ACTIVE" && (
                  <form action={updateNurserySubscriptionStatus.bind(null, item.id, "PAUSED")}>
                    <button type="submit" className="btn btn-sm btn-amber">إيقاف مؤقت</button>
                  </form>
                )}
                {item.status === "PAUSED" && (
                  <form action={updateNurserySubscriptionStatus.bind(null, item.id, "ACTIVE")}>
                    <button type="submit" className="btn btn-sm btn-emerald">استئناف</button>
                  </form>
                )}
                {item.status !== "CANCELLED" && (
                  <form action={updateNurserySubscriptionStatus.bind(null, item.id, "CANCELLED")}>
                    <button type="submit" className="btn btn-sm btn-danger-outline">إلغاء</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-card mt-6">
        <h2 className="section-title">الفواتير</h2>
        <div className="mt-3 space-y-2">
          {invoices.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm">
              <span>{item.invoiceNumber} — {item.child.name} — {formatMoney(item.amount)} ج.م</span>
              <div className="flex gap-3">
                {item.status !== "PAID" && (
                  <form action={markNurseryInvoicePaid.bind(null, item.id)}>
                    <button type="submit" className="btn btn-sm btn-emerald">تسجيل السداد</button>
                  </form>
                )}
                <Link href={`/admin/nursery/billing/invoices/${item.id}/edit`} className="btn btn-sm btn-outline">
                  تعديل
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
