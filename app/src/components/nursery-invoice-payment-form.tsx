"use client";

import { useActionState } from "react";
import { payNurseryInvoice, type PaymentActionState } from "@/app/actions/payments";

export function NurseryInvoicePaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, action, pending] = useActionState<PaymentActionState, FormData>(payNurseryInvoice, undefined);
  return <form action={action} className="flex items-center gap-2"><input type="hidden" name="invoiceId" value={invoiceId} /><select name="method" defaultValue="CASH" className="rounded-lg border border-slate-300 px-2 py-1 text-xs"><option value="CASH">كاش</option><option value="MOBILE_WALLET">محفظة</option><option value="BANK_TRANSFER">تحويل</option></select><button type="submit" disabled={pending} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">{pending ? "..." : "سداد"}</button>{state?.message && <span className="text-xs text-red-600">{state.message}</span>}</form>;
}
