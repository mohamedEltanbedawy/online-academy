"use client";

import { useState } from "react";

// كود الدعوة + زر نسخ
export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // المتصفح منع النسخ — المستخدم يقدر ينسخ بالعادي
    }
  }

  return (
    <div className="flex items-center gap-3">
      <code
        dir="ltr"
        className="rounded-lg bg-slate-100 px-4 py-2 text-lg font-bold tracking-widest text-slate-900"
      >
        {code}
      </code>
      <button
        type="button"
        onClick={copyCode}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        {copied ? "تم النسخ ✓" : "نسخ الكود"}
      </button>
    </div>
  );
}
