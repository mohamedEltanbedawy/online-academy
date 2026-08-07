"use client";

import { useActionState } from "react";
import { updateClass } from "@/app/actions/admin";

export function AdminEditClassForm({ cls }: { cls: { id: string; name: string; subject: string; description: string | null; pricePerHour: number; platformPercent: number; fixedFee: number } }) {
  const [state, action, pending] = useActionState(updateClass, undefined);
  return <form action={action} className="space-y-4"><input type="hidden" name="id" value={cls.id} /><input name="name" required defaultValue={cls.name} placeholder="اسم الفصل" className="w-full rounded-lg border border-slate-300 px-3 py-2" />{state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}<input name="subject" required defaultValue={cls.subject} placeholder="المادة" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><textarea name="description" defaultValue={cls.description ?? ""} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><div className="grid gap-3 sm:grid-cols-3"><input name="pricePerHour" type="number" step="0.01" defaultValue={cls.pricePerHour} className="rounded-lg border border-slate-300 px-3 py-2" /><input name="platformPercent" type="number" step="0.01" defaultValue={cls.platformPercent} className="rounded-lg border border-slate-300 px-3 py-2" /><input name="fixedFee" type="number" step="0.01" defaultValue={cls.fixedFee} className="rounded-lg border border-slate-300 px-3 py-2" /></div><button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ الفصل"}</button></form>;
}
