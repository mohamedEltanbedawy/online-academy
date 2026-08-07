import { PrismaClient } from "@prisma/client";

// كائن واحد مشترك من قاعدة البيانات لكل التطبيق
// (من غير ده، كل request كان هيعمل اتصال جديد — مضيعة للموارد)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
