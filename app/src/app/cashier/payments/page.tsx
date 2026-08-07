import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CashierPaymentsPage() {
  const cashier = await requireRole("CASHIER");
  const payments = await prisma.payment.findMany({ where: { cashierId: cashier.id }, include: { student: { select: { name: true } }, class: { select: { name: true } } }, orderBy: { paidAt: "desc" }, take: 100 });
  return (
    <AppShell
      title="سجل المدفوعات"
      subtitle="آخر 100 عملية منفذة بحسابك."
    >
      {payments.length === 0 ? (
        <div className="empty-state">لا توجد عمليات بعد.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الإيصال</th>
                <th>الطالب</th>
                <th>الفصل</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <Link href={`/cashier/payments/${payment.id}`} className="font-mono text-emerald-700 hover:underline">{payment.receiptNumber}</Link>
                  </td>
                  <td>{payment.student?.name}</td>
                  <td>{payment.class?.name}</td>
                  <td className="font-semibold">{formatMoney(payment.amount)} ج.م</td>
                  <td className="text-slate-500">{payment.paidAt.toLocaleDateString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
