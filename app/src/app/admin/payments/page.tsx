import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireRole("ADMIN");
  const payments = await prisma.payment.findMany({ include: { student: { select: { name: true } }, cashier: { select: { name: true } }, class: { select: { name: true } } }, orderBy: { paidAt: "desc" }, take: 200 });
  const total = payments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount.toNumber(), 0);
  return (
    <AppShell
      title="تقرير المدفوعات"
      subtitle={`آخر ${payments.length} عملية.`}
    >
      <section className="card border-emerald-200 bg-gradient-to-l from-emerald-50 to-teal-50 p-6">
        <p className="text-sm text-emerald-700">إجمالي العمليات الظاهرة</p>
        <p className="mt-1 text-3xl font-bold text-emerald-800">{formatMoney(total)} ج.م</p>
      </section>

      <div className="table-wrap mt-6">
        <table>
          <thead>
            <tr>
              <th>الإيصال</th>
              <th>الطالب</th>
              <th>الفصل</th>
              <th>الكاشير</th>
              <th>المبلغ</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="font-mono">{payment.receiptNumber}</td>
                <td>{payment.student?.name ?? "-"}</td>
                <td>{payment.class?.name ?? "-"}</td>
                <td>{payment.cashier.name}</td>
                <td className="font-semibold">{formatMoney(payment.amount)} ج.م</td>
                <td>{payment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
