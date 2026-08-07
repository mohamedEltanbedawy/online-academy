import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

function hmacPayload(obj: Record<string, unknown>) {
  const source = obj.source_data as Record<string, unknown> | undefined;
  const order = obj.order as Record<string, unknown> | undefined;
  return [obj.amount_cents, obj.created_at, obj.currency, obj.error_occured, obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure, obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment, obj.is_void, order?.id, obj.owner, obj.pending, source?.pan, source?.sub_type, source?.type, obj.success].map((value) => String(value ?? "")).join("");
}

export async function POST(request: Request) {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  const body = await request.json().catch(() => null) as { obj?: Record<string, unknown>; hmac?: string } | null;
  if (!secret || !body?.obj || !body.hmac) return Response.json({ message: "Webhook غير مهيأ" }, { status: 503 });
  const expected = createHmac("sha512", secret).update(hmacPayload(body.obj)).digest("hex");
  const valid = expected.length === body.hmac.length && timingSafeEqual(Buffer.from(expected), Buffer.from(body.hmac));
  if (!valid) return Response.json({ message: "HMAC غير صحيح" }, { status: 403 });

  const obj = body.obj;
  const order = obj.order as Record<string, unknown> | undefined;
  const orderId = String(order?.id ?? "");
  const success = obj.success === true || obj.success === "true";
  const payment = await prisma.payment.findFirst({ where: { gatewayOrderId: orderId } });
  if (!payment) return Response.json({ received: true });

  if (success) {
    const operations = [prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID", gatewayTransactionId: String(obj.id), gatewayResponse: body as object, paidAt: new Date() } })];
    if (payment.studentId && payment.classId) operations.push(prisma.enrollment.upsert({ where: { classId_studentId: { classId: payment.classId, studentId: payment.studentId } }, update: { status: "ACTIVE", source: "PLATFORM" }, create: { classId: payment.classId, studentId: payment.studentId, source: "PLATFORM", status: "ACTIVE" } }) as never);
    if (payment.nurseryInvoiceId) operations.push(prisma.nurseryInvoice.update({ where: { id: payment.nurseryInvoiceId }, data: { status: "PAID", paidAt: new Date() } }) as never);
    await prisma.$transaction(operations);
  } else {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", gatewayTransactionId: String(obj.id), gatewayResponse: body as object } });
  }
  return Response.json({ received: true });
}
