import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTelegramToken } from "@/lib/telegram";
import { TelegramLinkButton } from "@/components/telegram-link-button";

export const dynamic = "force-dynamic";

export default async function AdminTelegramPage() {
  await requireRole("ADMIN");
  const configured = hasTelegramToken();
  const [chats, users] = await Promise.all([
    prisma.telegramChat.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({
      where: { telegramChats: { none: {} } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
  ]);

  return (
    <AppShell title="بوت تيليجرام" subtitle="ربط أولياء الأمور بالبوت وتسجيل البيانات الصحية عبر المحادثة." maxWidth="max-w-4xl">
      {!configured ? (
        <section className="card border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-800">الخطوة الأولى: اضبط التوكن</h2>
          <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-amber-800">
            <li>كلم <b>@BotFather</b> في تيليجرام وأنشئ بوتًا جديدًا للحصول على التوكن.</li>
            <li>ضع التوكن في <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">TELEGRAM_BOT_TOKEN</code> داخل ملف <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">app/.env</code>.</li>
            <li>أعد تشغيل الخادم، ثم ارجع لهذه الصفحة لتسجيل الـ webhook.</li>
          </ol>
        </section>
      ) : (
        <section className="card border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-bold text-emerald-800">التوكن مضبوط ✅</h2>
          <p className="mt-2 text-sm text-emerald-700">البوت جاهز. احفظ عنوان الويب سيرفر وتأكد إنه متاح للإنترنت، ثم سجّل الـ webhook:</p>
          <Link href="/api/telegram/setwebhook" className="btn-primary mt-4">تسجيل Webhook عند تيليجرام</Link>
        </section>
      )}

      <section className="section-card mt-6">
        <h2 className="section-title">المحادثات المرتبطة ({chats.length})</h2>
        {chats.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا توجد محادثات مرتبطة بعد. اختر مستخدمًا بالأسفل وأنشئ رمز ربط.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {chats.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-semibold">{c.user ? c.user.name : "غير مرتبط"}</p>
                  <p className="text-xs text-slate-500">{c.user?.email ?? "بدون حساب"} • chatId: {c.chatId} • {c.linkedAt?.toLocaleDateString("ar-EG") ?? "-"}</p>
                </div>
                <span className="badge badge-green">{c.userId ? "مربوط" : "معلق"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-card mt-6">
        <h2 className="section-title">مستخدمون بدون ربط — أنشئ رمزًا</h2>
        {users.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">كل المستخدمين مرتبطين بالبوت.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email} • {u.role}</p>
                </div>
                <TelegramLinkButton userId={u.id} name={u.name} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
