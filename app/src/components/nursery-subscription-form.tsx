"use client";

import { useActionState } from "react";
import { createNurserySubscription, type BillingActionState } from "@/app/actions/billing";

type ChildOption = { id: string; name: string };

export function NurserySubscriptionForm({ childOptions }: { childOptions: ChildOption[] }) {
  const [state, action, pending] = useActionState<BillingActionState, FormData>(createNurserySubscription, undefined);
  return <form action={action} className="space-y-3">{state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}<select name="childId" required defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">اختر الطفل</option>{childOptions.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select><input name="planName" required placeholder="اسم الباقة" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><div className="grid gap-3 sm:grid-cols-3"><input name="monthlyAmount" type="number" min="0.01" step="0.01" required placeholder="المبلغ الشهري" className="rounded-lg border border-slate-300 px-3 py-2" /><input name="discount" type="number" min="0" step="0.01" defaultValue="0" placeholder="الخصم" className="rounded-lg border border-slate-300 px-3 py-2" /><input name="startDate" type="date" required className="rounded-lg border border-slate-300 px-3 py-2" /></div><button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "إنشاء الاشتراك والفاتورة"}</button></form>;
}
