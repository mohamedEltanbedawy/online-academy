"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type BillingActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

function invoiceNumber() { return `NINV-${Date.now()}-${randomInt(100, 999)}`; }

export async function createNurserySubscription(state: BillingActionState, formData: FormData): Promise<BillingActionState> {
  const admin = await requireRole("ADMIN");
  const childId = String(formData.get("childId") || "");
  const planName = String(formData.get("planName") || "").trim();
  const monthlyAmount = Number(formData.get("monthlyAmount"));
  const discount = Number(formData.get("discount") || 0);
  const startDate = new Date(String(formData.get("startDate") || ""));
  const errors: Record<string, string[]> = {};
  if (planName.length < 3) errors.planName = ["اكتب اسم الباقة"];
  if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) errors.monthlyAmount = ["اكتب قيمة شهرية صحيحة"];
  if (!Number.isFinite(discount) || discount < 0 || discount >= monthlyAmount) errors.discount = ["الخصم غير صحيح"];
  if (Number.isNaN(startDate.getTime())) errors.startDate = ["اختر تاريخ البداية"];
  if (Object.keys(errors).length > 0) return { errors };
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) return { message: "الطفل غير موجود" };
  const nextDueDate = new Date(startDate); nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  const netAmount = new Prisma.Decimal(monthlyAmount).sub(discount);
  const subscription = await prisma.$transaction(async (tx) => {
    const created = await tx.nurserySubscription.create({ data: { childId, planName, monthlyAmount, discount, startDate, nextDueDate } });
    await tx.nurseryInvoice.create({ data: { invoiceNumber: invoiceNumber(), childId, subscriptionId: created.id, amount: netAmount, dueDate: nextDueDate } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "CREATE_NURSERY_SUBSCRIPTION", entity: "NurserySubscription", entityId: created.id, details: { childId, monthlyAmount } } });
    return created;
  });
  redirect(`/admin/nursery/billing?child=${subscription.childId}`);
}

export async function generateNurseryInvoice(subscriptionId: string) {
  const admin = await requireRole("ADMIN");
  const subscription = await prisma.nurserySubscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) return;
  const dueDate = new Date(subscription.nextDueDate); dueDate.setMonth(dueDate.getMonth() + 1);
  const amount = new Prisma.Decimal(subscription.monthlyAmount).sub(subscription.discount);
  await prisma.$transaction([
    prisma.nurseryInvoice.create({ data: { invoiceNumber: invoiceNumber(), childId: subscription.childId, subscriptionId, amount, dueDate } }),
    prisma.nurserySubscription.update({ where: { id: subscriptionId }, data: { nextDueDate: dueDate } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "GENERATE_NURSERY_INVOICE", entity: "NurseryInvoice", entityId: subscriptionId } }),
  ]);
  revalidatePath("/admin/nursery/billing");
}

export async function markNurseryInvoicePaid(invoiceId: string) {
  const admin = await requireRole("ADMIN");
  await prisma.$transaction([
    prisma.nurseryInvoice.update({ where: { id: invoiceId }, data: { status: "PAID", paidAt: new Date() } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "MARK_NURSERY_INVOICE_PAID", entity: "NurseryInvoice", entityId: invoiceId } }),
  ]);
  revalidatePath("/admin/nursery/billing");
}

export async function updateNurserySubscription(state: BillingActionState, formData: FormData): Promise<BillingActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const planName = String(formData.get("planName") || "").trim();
  const monthlyAmount = Number(formData.get("monthlyAmount"));
  const discount = Number(formData.get("discount") || 0);
  if (planName.length < 3 || !Number.isFinite(monthlyAmount) || monthlyAmount <= 0 || !Number.isFinite(discount) || discount < 0 || discount >= monthlyAmount) return { message: "بيانات الاشتراك غير صحيحة" };
  await prisma.$transaction([
    prisma.nurserySubscription.update({ where: { id }, data: { planName, monthlyAmount, discount } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_NURSERY_SUBSCRIPTION", entity: "NurserySubscription", entityId: id } }),
  ]);
  revalidatePath("/admin/nursery/billing");
  redirect("/admin/nursery/billing");
}

const SUBSCRIPTION_STATUSES = ["ACTIVE", "PAUSED", "CANCELLED", "PAST_DUE"] as const;

export async function updateNurserySubscriptionStatus(subscriptionId: string, status: string) {
  const admin = await requireRole("ADMIN");
  if (!SUBSCRIPTION_STATUSES.includes(status as (typeof SUBSCRIPTION_STATUSES)[number])) return;
  const subscription = await prisma.nurserySubscription.findUnique({ where: { id: subscriptionId }, select: { id: true, childId: true } });
  if (!subscription) return;
  await prisma.$transaction([
    prisma.nurserySubscription.update({ where: { id: subscriptionId }, data: { status: status as (typeof SUBSCRIPTION_STATUSES)[number] } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_NURSERY_SUBSCRIPTION_STATUS", entity: "NurserySubscription", entityId: subscriptionId, details: { childId: subscription.childId, status } } }),
  ]);
  revalidatePath("/admin/nursery/billing");
}

export async function updateNurseryInvoice(state: BillingActionState, formData: FormData): Promise<BillingActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const dueDate = new Date(String(formData.get("dueDate") || ""));
  const status = String(formData.get("status") || "");
  if (Number.isNaN(dueDate.getTime()) || !["ISSUED", "PAID", "OVERDUE", "CANCELLED"].includes(status)) return { message: "بيانات الفاتورة غير صحيحة" };
  await prisma.$transaction([
    prisma.nurseryInvoice.update({ where: { id }, data: { dueDate, status: status as "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED", paidAt: status === "PAID" ? new Date() : null } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_NURSERY_INVOICE", entity: "NurseryInvoice", entityId: id } }),
  ]);
  revalidatePath("/admin/nursery/billing");
  redirect("/admin/nursery/billing");
}
