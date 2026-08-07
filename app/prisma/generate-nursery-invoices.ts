import { randomInt } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function invoiceNumber() {
  return `NINV-${Date.now()}-${randomInt(100, 999)}`;
}

async function main() {
  const now = new Date();
  const subscriptions = await prisma.nurserySubscription.findMany({ where: { status: "ACTIVE", nextDueDate: { lte: now } } });
  let created = 0;
  for (const subscription of subscriptions) {
    const amount = subscription.monthlyAmount.sub(subscription.discount);
    const dueDate = new Date(subscription.nextDueDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    await prisma.$transaction([
      prisma.nurseryInvoice.create({ data: { invoiceNumber: invoiceNumber(), childId: subscription.childId, subscriptionId: subscription.id, amount, dueDate: subscription.nextDueDate } }),
      prisma.nurserySubscription.update({ where: { id: subscription.id }, data: { nextDueDate: dueDate } }),
    ]);
    created++;
  }
  console.log(`Generated nursery invoices: ${created}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
