"use client";

import { useActionState } from "react";
import { updateNurseryInvoice, type BillingActionState } from "@/app/actions/billing";

export function EditNurseryInvoiceForm({ invoice }: { invoice: { id: string; dueDate: string; status: string } }) {
  const [state, action, pending] = useActionState<BillingActionState, FormData>(updateNurseryInvoice, undefined);
  return <form action={action} className="space-y-3"><input type="hidden" name="id" value={invoice.id} /><input name="dueDate" type="date" defaultValue={invoice.dueDate} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><select name="status" defaultValue={invoice.status} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="ISSUED">مطلوبة</option><option value="PAID">مدفوعة</option><option value="OVERDUE">متأخرة</option><option value="CANCELLED">ملغية</option></select>{state?.message && <p className="text-sm text-red-600">{state.message}</p>}<button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ الفاتورة"}</button></form>;
}
