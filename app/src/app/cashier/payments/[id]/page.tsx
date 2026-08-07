import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const methods: Record<string, string> = { CASH: "كاش", MOBILE_WALLET: "محفظة إلكترونية", BANK_TRANSFER: "تحويل بنكي", GATEWAY: "بوابة دفع" };

export default async function PaymentReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const cashier = await requireRole("CASHIER");
  const { id } = await params;
  const payment = await prisma.payment.findFirst({ where: { id, cashierId: cashier.id }, include: { student: { select: { name: true, email: true, phone: true } }, class: { select: { name: true, subject: true } }, cashier: { select: { name: true } } } });
  if (!payment) notFound();
  return (
    <AppShell
      title="إيصال دفع"
      subtitle="تم الدفع والتفعيل"
      actions={
        <Link href="/cashier/payments/new" className="btn-primary">دفعة جديدة</Link>
      }
    >
      <section className="section-card">
        <p className="text-center font-mono text-sm text-slate-500" dir="ltr">{payment.receiptNumber}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">الطالب</dt>
            <dd className="font-semibold">{payment.student?.name}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">الفصل</dt>
            <dd className="font-semibold">{payment.class?.name}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">المبلغ</dt>
            <dd className="text-xl font-bold text-emerald-700">{formatMoney(payment.amount)} ج.م</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">طريقة الدفع</dt>
            <dd className="font-semibold">{methods[payment.method]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">التاريخ</dt>
            <dd className="font-semibold">{payment.paidAt.toLocaleString("ar-EG")}</dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}
