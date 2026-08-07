import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireRole("ADMIN");
  const payouts = await prisma.payout.findMany({ include: { teacher: { select: { name: true, email: true } }, payment: { select: { receiptNumber: true, paidAt: true } } }, orderBy: { createdAt: "desc" } });
  const rows = [
    ["Teacher", "Email", "Receipt", "Gross", "Platform Fee", "Teacher Amount", "Status", "Paid At"],
    ...payouts.map((item) => [item.teacher.name, item.teacher.email, item.payment.receiptNumber, item.grossAmount.toFixed(2), item.platformFee.toFixed(2), item.teacherAmount.toFixed(2), item.status, item.payment.paidAt.toISOString()]),
  ];
  const body = rows.map((row) => row.map(csv).join(",")).join("\r\n");
  return new Response(`\ufeff${body}\r\n`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=teacher-payouts.csv" } });
}
