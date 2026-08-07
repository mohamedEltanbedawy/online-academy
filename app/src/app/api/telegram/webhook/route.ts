import { NextRequest, NextResponse } from "next/server";
import { handleUpdate } from "@/lib/telegram-handler";
import { hasTelegramToken } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!hasTelegramToken()) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN غير مضبوط في .env" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "بدون بيانات" }, { status: 400 });

  // نبقي الرد سريعًا ولا نمنع تيليجرام (لا ننتظر الرسالة)
  void handleUpdate(body);
  return NextResponse.json({ ok: true });
}
