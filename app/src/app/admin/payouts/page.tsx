import { generatePayouts, markPayoutPaid } from "@/app/actions/admin";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const payouts = await prisma.payout.findMany({ include: { teacher: { select: { name: true, email: true } }, payment: { select: { receiptNumber: true, paidAt: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  const total = payouts.reduce((sum, item) => sum + item.teacherAmount.toNumber(), 0);
  const pending = payouts.filter((item) => item.status === "PENDING").length;
  return (
    <AppShell
      title="تسويات المدرسين"
      subtitle="الناتج حسب مصدر الطالب ونموذج ربح الفصل."
    >
      {params.created && (
        <p className="mb-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          تم إنشاء {params.created} تسوية جديدة.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <form action={generatePayouts}>
          <button type="submit" className="btn btn-primary">توليد التسويات الجديدة</button>
        </form>
        <a href="/api/admin/payouts/export" className="btn btn-outline">تصدير CSV</a>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="stat-label">إجمالي نصيب المدرسين</p>
          <p className="stat-value">{formatMoney(total)} ج.م</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">تسويات معلقة</p>
          <p className="stat-value text-amber-700">{pending}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">عدد التسويات</p>
          <p className="stat-value">{payouts.length}</p>
        </div>
      </section>

      <div className="table-wrap mt-6">
        <table>
          <thead>
            <tr>
              <th>المدرس</th>
              <th>الإيصال</th>
              <th>الإجمالي</th>
              <th>عمولة المنصة</th>
              <th>نصيب المدرس</th>
              <th>الحالة</th>
              <th>تحكم</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.teacher.name}
                  <br />
                  <span className="text-xs text-slate-500">{item.teacher.email}</span>
                </td>
                <td className="font-mono">{item.payment.receiptNumber}</td>
                <td>{formatMoney(item.grossAmount)}</td>
                <td>{formatMoney(item.platformFee)}</td>
                <td className="font-bold text-emerald-700">{formatMoney(item.teacherAmount)}</td>
                <td>
                  <span className={item.status === "PAID" ? "badge badge-green" : "badge badge-amber"}>
                    {item.status === "PAID" ? "تم الدفع" : "معلق"}
                  </span>
                </td>
                <td>
                  {item.status === "PENDING" && (
                    <form action={markPayoutPaid.bind(null, item.id)}>
                      <button type="submit" className="btn btn-sm btn-emerald">تأكيد الدفع</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
