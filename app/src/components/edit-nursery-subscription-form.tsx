"use client";

import { useActionState } from "react";
import { updateNurserySubscription, type BillingActionState } from "@/app/actions/billing";

export function EditNurserySubscriptionForm({ subscription }: { subscription: { id: string; planName: string; monthlyAmount: number; discount: number } }) {
  const [state, action, pending] = useActionState<BillingActionState, FormData>(updateNurserySubscription, undefined);
  return <form action={action} className="space-y-3"><input type="hidden" name="id" value={subscription.id} /><input name="planName" defaultValue={subscription.planName} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><div className="grid gap-3 sm:grid-cols-2"><input name="monthlyAmount" type="number" step="0.01" defaultValue={subscription.monthlyAmount} className="rounded-lg border border-slate-300 px-3 py-2" /><input name="discount" type="number" step="0.01" defaultValue={subscription.discount} className="rounded-lg border border-slate-300 px-3 py-2" /></div>{state?.message && <p className="text-sm text-red-600">{state.message}</p>}<button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ الاشتراك"}</button></form>;
}
