"use client";

import { useEffect, useState } from "react";

export function PaymobCheckout({ classId, invoiceId }: { classId?: string; invoiceId?: string }) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("جاري تجهيز بوابة الدفع...");

  useEffect(() => {
    let active = true;
    const endpoint = invoiceId ? "/api/payments/paymob/nursery-start" : "/api/payments/paymob/start";
    const payload = invoiceId ? { invoiceId } : { classId };
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "تعذر تجهيز الدفع");
        if (active) { setUrl(data.iframeUrl); setMessage(""); }
      })
      .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "تعذر تجهيز الدفع"); });
    return () => { active = false; };
  }, [classId, invoiceId]);

  return <div className="space-y-3">{message && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}{url && <iframe title="Paymob Checkout" src={url} className="h-[42rem] w-full rounded-xl border border-slate-200" />}</div>;
}
