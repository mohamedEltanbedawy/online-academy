"use server";

import { randomInt } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type PaymentActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function recordCashierPayment(state: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const cashier = await requireRole("CASHIER");
  const studentLookup = String(formData.get("studentLookup") || "").trim().toLowerCase();
  const classId = String(formData.get("classId") || "");
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") || "");
  const source = String(formData.get("source") || "");
  const description = String(formData.get("description") || "").trim();

  const errors: Record<string, string[]> = {};
  if (studentLookup.length < 3) errors.studentLookup = ["اكتب إيميل أو رقم موبايل الطالب"];
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = ["اكتب مبلغ أكبر من صفر"];
  if (!["CASH", "MOBILE_WALLET", "BANK_TRANSFER", "GATEWAY"].includes(method)) errors.method = ["اختر طريقة الدفع"];
  if (!["PLATFORM", "TEACHER"].includes(source)) errors.source = ["اختر مصدر الطالب"];

  const student = await prisma.user.findFirst({ where: { role: "STUDENT", OR: [{ email: studentLookup }, { phone: studentLookup }] } });
  if (!student) errors.studentLookup = ["الطالب غير موجود"];
  const cls = await prisma.class.findFirst({ where: { id: classId, status: "ACTIVE" } });
  if (!cls) errors.classId = ["الفصل غير موجود أو مقفول"];
  if (Object.keys(errors).length > 0 || !student || !cls) return { errors };

  const receiptNumber = `RCPT-${Date.now()}-${randomInt(100, 999)}`;
  const payment = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({ where: { classId_studentId: { classId, studentId: student.id } } });
    if (enrollment) {
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: "ACTIVE", source: source as "PLATFORM" | "TEACHER" } });
    } else {
      await tx.enrollment.create({ data: { classId, studentId: student.id, source: source as "PLATFORM" | "TEACHER", status: "ACTIVE" } });
    }
    return tx.payment.create({ data: { receiptNumber, studentId: student.id, cashierId: cashier.id, classId, amount, method: method as "CASH" | "MOBILE_WALLET" | "BANK_TRANSFER" | "GATEWAY", description: description || `تفعيل اشتراك ${cls.name}` } });
  });

  redirect(`/cashier/payments/${payment.id}`);
}

export async function payNurseryInvoice(state: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const cashier = await requireRole("CASHIER");
  const invoiceId = String(formData.get("invoiceId") || "");
  const method = String(formData.get("method") || "CASH");
  if (!["CASH", "MOBILE_WALLET", "BANK_TRANSFER", "GATEWAY"].includes(method)) return { message: "طريقة الدفع غير صحيحة" };
  const invoice = await prisma.nurseryInvoice.findFirst({ where: { id: invoiceId, status: { not: "PAID" } } });
  if (!invoice) return { message: "الفاتورة غير موجودة أو مدفوعة" };
  const receiptNumber = `NRCPT-${Date.now()}-${randomInt(100, 999)}`;
  const payment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({ data: { receiptNumber, studentId: null, cashierId: cashier.id, amount: invoice.amount, method: method as "CASH" | "MOBILE_WALLET" | "BANK_TRANSFER" | "GATEWAY", status: "PAID", description: `سداد فاتورة حضانة ${invoice.invoiceNumber}`, nurseryInvoiceId: invoice.id } });
    await tx.nurseryInvoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: new Date() } });
    return payment;
  });
  redirect(`/cashier/payments/${payment.id}`);
}
