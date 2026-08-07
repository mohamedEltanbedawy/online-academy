import "server-only";
import { prisma } from "./prisma";

// طبقة تيليجرام — إرسال رسائل من البوت للحسابات المرتبطة
// التوكن بيُقرأ من TELEGRAM_BOT_TOKEN في .env (ما بيتكمنش في قاعدة البيانات)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export function hasTelegramToken() {
  return BOT_TOKEN.length > 0;
}

export function getBotToken() {
  return BOT_TOKEN;
}

const api = (method: string, body: object) =>
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// إرسال رسالة لمحادثة
export async function sendMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) return;
  try {
    await api("sendMessage", { chat_id: chatId, text, parse_mode: "Markdown" });
  } catch {
    // نتجاهل أخطاء الإرسال (إنترنت/حظر)
  }
}

// توليد رمز ربط لمستخدم (صالح 10 دقائق)
export async function createLinkCode(userId: string, tenantId: string | null) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.telegramLinkCode.create({ data: { code, userId, tenantId, expiresAt } });
  // احذف الأكواد القديمة الغير مستخدمة
  await prisma.telegramLinkCode.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return code;
}

// ربط محادثة برمز — بترجع الرسالة المناسبة
export async function redeemLinkCode(chatId: string, code: string): Promise<string> {
  const clean = code.trim().replace(/[^0-9]/g, "");
  const link = await prisma.telegramLinkCode.findUnique({ where: { code: clean } });
  if (!link || link.expiresAt < new Date() || link.usedAt) {
    return "الرمز غير صالح أو منتهي الصلاحية. اطلب رمزًا جديدًا من اللوحة.";
  }
  await prisma.telegramLinkCode.update({ where: { id: link.id }, data: { usedAt: new Date() } });
  const existing = await prisma.telegramChat.findUnique({ where: { chatId } });
  if (existing) {
    await prisma.telegramChat.update({ where: { chatId }, data: { userId: link.userId, tenantId: link.tenantId, linkedAt: new Date() } });
  } else {
    await prisma.telegramChat.create({ data: { chatId, userId: link.userId, tenantId: link.tenantId, linkedAt: new Date() } });
  }
  const user = await prisma.user.findUnique({ where: { id: link.userId } });
  return `تم ربط حسابك (${user?.name ?? link.userId}) بنجاح. أرسل لي أي قياس صحي (نصًا أو صورة) وسأحفظه في ملف طفلك، أو اكتب /health لعرض آخر البيانات.`;
}

// مستخدم المحادثة الحالية (إذا كان مربوطًا)
export async function getChatUser(chatId: string) {
  const chat = await prisma.telegramChat.findUnique({ where: { chatId } });
  if (!chat?.userId) return null;
  return prisma.user.findUnique({ where: { id: chat.userId } });
}
