"use client";

import { useState } from "react";
import { generateTelegramLinkCode } from "@/app/actions/telegram";

export function TelegramLinkButton({ userId, name }: { userId: string; name: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const res = await generateTelegramLinkCode(userId);
    setCode(res.code ?? null);
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={onClick} disabled={pending} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
        {pending ? "..." : "رمز ربط"}
      </button>
      {code && <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-slate-800" title={`أرسله في البوت لربط حساب ${name}`}>{code}</span>}
    </div>
  );
}
