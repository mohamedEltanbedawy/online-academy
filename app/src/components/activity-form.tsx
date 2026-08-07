"use client";

import { useActionState } from "react";
import { createActivity, type ActivityActionState } from "@/app/actions/activities";

export function ActivityForm() {
  const [state, action, pending] = useActionState<ActivityActionState, FormData>(createActivity, undefined);
  return <form action={action} className="space-y-3">{state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}<div className="grid gap-3 sm:grid-cols-2"><input name="title" required placeholder="اسم الفعالية" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /><input name="type" required placeholder="رياضية / فنية / رحلة" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /></div><textarea name="description" rows={3} placeholder="الوصف والتجهيزات المطلوبة" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /><div className="grid gap-3 sm:grid-cols-3"><input name="scheduledAt" type="datetime-local" required className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /><input name="location" placeholder="المكان" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /><input name="capacity" type="number" min="1" defaultValue="20" placeholder="السعة" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /></div><button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{pending ? "جاري الحفظ..." : "إضافة الفعالية"}</button></form>;
}
