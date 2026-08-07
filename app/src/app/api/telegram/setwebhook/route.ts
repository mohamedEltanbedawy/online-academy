import { NextRequest, NextResponse } from "next/server";
import { getBotToken } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// تسجيل/تحديث webhook البوت عند تيليجرام — يُستدعى من لوحة الإدارة
export async function POST(req: NextRequest) {
  const token = getBotToken();
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN غير مضبوط في .env" }, { status: 503 });
  }
  const url = new URL("/api/telegram/webhook", req.nextUrl.origin).toString();
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(url)}`, { method: "POST" });
  const data = await res.json();
  return NextResponse.json({ ok: !!data.ok, result: data });
}
