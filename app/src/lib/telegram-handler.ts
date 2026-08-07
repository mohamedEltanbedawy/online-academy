import { prisma } from "@/lib/prisma";
import { askJson, askVision } from "@/lib/ai";
import { sendMessage, redeemLinkCode, getChatUser } from "@/lib/telegram";
import { saveParsedHealthData, getGuardianChildren, type ParsedHealth } from "@/lib/health-save";

// معالج رسائل البوت: /start، /link <رمز>، /health، نص حر أو صورة (بيانات صحية)

const SYSTEM_PROMPT = `أنت مساعد لملف صحي لطفل في روضة. حوّل النص/الصورة إلى بيانات صحية منظمة JSON فقط، بدون أي كلام إضافي.
التنسيق المطلوب (أو [] لو مفيش بيانات):
{
  "growth": [{ "date": "YYYY-MM-DD", "weightKg": عدد, "heightCm": عدد, "headCm": عدد|null, "notes": "نص|null" }],
  "vaccinations": [{ "name": "اسم", "dose": "نص|null", "date": "YYYY-MM-DD", "nextDueDate": "YYYY-MM-DD|null", "notes": "نص|null" }],
  "sleep": [{ "date": "YYYY-MM-DD", "hours": عدد, "quality": "نص|null", "notes": "نص|null" }],
  "nutrition": [{ "date": "YYYY-MM-DD", "meal": "فطار/غدا/عشا/سناك|null", "foods": "أطعمة", "notes": "نص|null" }],
  "medicines": [{ "name": "اسم", "dosage": "نص|null", "frequency": "نص|null", "startDate": "YYYY-MM-DD|null", "endDate": "YYYY-MM-DD|null", "notes": "نص|null" }]
}
لو التاريخ مش موجود استخدم اليوم. لو أرقام ناقصة سيبها null.`;

export async function handleUpdate(update: { message?: { chat?: { id?: number }; text?: string; from?: { id?: number }; photo?: { file_id?: string }[] } }) {
  const msg = update.message;
  if (!msg?.chat?.id) return;
  const chatId = String(msg.chat.id);

  const text = (msg.text ?? "").trim();

  if (text === "/start" || text === "/help") {
    await sendMessage(
      chatId,
      `مرحبًا بك في بوت الصحة 👋\n\nالأوامر:\n- أرسل *رمز الربط* من لوحة المنصة (المستخدمين → ربط تيليجرام) لتفعيل حسابك\n- اكتب أو صوّر أي بيانات صحية (وزن، طول، تطعيم، دواء، نوم، غذاء) وسأحفظها تلقائيًا\n- /health لعرض آخر بيانات طفلك\n- /link <رمز> للربط`
    );
    return;
  }

  if (text.startsWith("/link")) {
    const code = text.replace("/link", "").trim();
    const reply = await redeemLinkCode(chatId, code);
    await sendMessage(chatId, reply);
    return;
  }

  const user = await getChatUser(chatId);
  const chat = await prisma.telegramChat.findUnique({ where: { chatId } });

  if (text === "/health") {
    if (!user) return sendMessage(chatId, "حسابك مش مربوط. أرسل رمز الربط من اللوحة أولًا.");
    const children = await getGuardianChildren(user.id);
    if (children.length === 0) return sendMessage(chatId, "لا يوجد أطفال مرتبطون بحسابك.");
    const lines = [];
    for (const c of children) {
      const [g, v] = await Promise.all([
        prisma.growthRecord.findFirst({ where: { childId: c.id }, orderBy: { date: "desc" } }),
        prisma.medicine.findMany({ where: { childId: c.id, active: true } }),
      ]);
      lines.push(
        `*${c.name}*\n` +
          (g ? `آخر قياس: ${g.date.toLocaleDateString("ar-EG")} — وزن ${g.weightKg?.toString() ?? "-"} طول ${g.heightCm?.toString() ?? "-"}` : "لا توجد قياسات بعد.") +
          (v.length > 0 ? `\nأدوية نشطة: ${v.map((m) => m.name).join("، ")}` : "")
      );
    }
    await sendMessage(chatId, lines.join("\n\n"));
    return;
  }

  if (!user) return sendMessage(chatId, "حسابك مش مربوط. أرسل رمز الربط من اللوحة أولًا.");

  const children = await getGuardianChildren(user.id);
  if (children.length === 0) return sendMessage(chatId, "لا يوجد أطفال مرتبطون بحسابك لتخزين البيانات.");
  const child = children[0];

  let parsed: ParsedHealth;
  try {
    if (msg.photo?.length) {
      // صورة: ناخذ أكبر حجم ونحمّله من تيليجرام ثم نمرره للموديل
      const last = msg.photo[msg.photo.length - 1];
      if (!last?.file_id) return sendMessage(chatId, "تعذر تحميل الصورة.");
      const fileUrl = await downloadFile(last.file_id);
      if (!fileUrl) return sendMessage(chatId, "تعذر تحميل الصورة.");
      const raw = await askVision(`استخرج البيانات الصحية من هذه الصورة/الورقة. ${SYSTEM_PROMPT}`, fileUrl.base64, fileUrl.mimeType);
      parsed = await askJson<ParsedHealth>(raw, SYSTEM_PROMPT);
    } else {
      parsed = await askJson<ParsedHealth>(text, SYSTEM_PROMPT);
    }
  } catch (err) {
    await sendMessage(chatId, `تعذر قراءة البيانات بالذكاء الاصطناعي: ${err instanceof Error ? err.message : "خطأ"}`);
    return;
  }

  const total = parsed.growth.length + parsed.vaccinations.length + parsed.sleep.length + parsed.nutrition.length + parsed.medicines.length;
  if (total === 0) {
    await sendMessage(chatId, "لم أجد بيانات صحية واضحة في رسالتك. جرّب صياغة أوضح (مثال: وزن 12.5 طول 95).");
    return;
  }

  const res = await saveParsedHealthData(chat?.tenantId ?? "", child.id, parsed);
  if (!res.ok) {
    await sendMessage(chatId, res.error);
    return;
  }
  const c = res.counts;
  await sendMessage(
    chatId,
    `تم الحفظ في ملف *${child.name}* ✅\nنمو: ${c.growth} • تطعيمات: ${c.vaccinations} • نوم: ${c.sleep} • غذاء: ${c.nutrition} • أدوية: ${c.medicines}\n\nلعرض التفاصيل افتح المنصة → الملف الصحي.`
  );
}

// تحميل صورة من تيليجرام وتحويلها base64
async function downloadFile(fileId: string): Promise<{ base64: string; mimeType: string } | null> {
  const { getBotToken } = await import("@/lib/telegram");
  const token = getBotToken();
  if (!token) return null;
  try {
    const info = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`).then((r) => r.json());
    const filePath = info?.result?.file_path;
    if (!filePath) return null;
    const buf = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`).then((r) => r.arrayBuffer());
    const mimeType = filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") ? "image/jpeg" : filePath.endsWith(".png") ? "image/png" : filePath.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return { base64: Buffer.from(buf).toString("base64"), mimeType };
  } catch {
    return null;
  }
}
