"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createLinkCode } from "@/lib/telegram";

// توليد رمز ربط تيليجرام لمستخدم — يظهر للمستخدم في اللوحة ويدخله في البوت
export async function generateTelegramLinkCode(userId: string) {
  await requireRole("ADMIN");
  const code = await createLinkCode(userId, null);
  revalidatePath("/admin/telegram");
  return { code };
}
