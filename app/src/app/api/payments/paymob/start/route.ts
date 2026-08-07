import { randomInt } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymobPayment, paymobConfigured } from "@/lib/paymob";

export async function POST(request: Request) {
  const student = await getCurrentUser();
  if (!student || student.role !== "STUDENT") return Response.json({ message: "غير مسموح" }, { status: 403 });
  if (!paymobConfigured()) return Response.json({ message: "بوابة Paymob غير مفعلة في إعدادات المشروع" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const cls = await prisma.class.findFirst({ where: { id: classId, status: "ACTIVE" } });
  if (!cls) return Response.json({ message: "الفصل غير موجود" }, { status: 404 });

  const receiptNumber = `ONL-${Date.now()}-${randomInt(100, 999)}`;
  const payment = await prisma.payment.create({ data: { receiptNumber, studentId: student.id, classId, cashierId: (await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } })).id, amount: cls.pricePerHour, method: "GATEWAY", status: "PENDING", description: `اشتراك ${cls.name}` } });
  try {
    const amountCents = Math.round(cls.pricePerHour.toNumber() * 100);
    const gateway = await createPaymobPayment({ amountCents, orderReference: payment.id, name: student.name, email: student.email, phone: student.phone });
    await prisma.payment.update({ where: { id: payment.id }, data: { gatewayOrderId: gateway.orderId, gatewayResponse: { orderId: gateway.orderId } } });
    return Response.json({ paymentId: payment.id, iframeUrl: gateway.iframeUrl });
  } catch (error) {
    console.error("Paymob start failed", error);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return Response.json({ message: "تعذر تجهيز الدفع الإلكتروني" }, { status: 502 });
  }
}
