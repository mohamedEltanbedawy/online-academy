"use client";

import { useActionState } from "react";
import { recordAttendance, type ActivityActionState } from "@/app/actions/activities";

export function AttendanceForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState<ActivityActionState, FormData>(recordAttendance, undefined);
  return <form action={action} className="space-y-3"><input type="hidden" name="childId" value={childId} /><div className="grid gap-3 sm:grid-cols-3"><input name="date" type="date" required className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /><select name="status" defaultValue="PRESENT" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"><option value="PRESENT">حاضر</option><option value="LATE">متأخر</option><option value="ABSENT">غائب</option></select><select name="mode" defaultValue="ONSITE" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"><option value="ONSITE">حضوري</option><option value="ONLINE">أونلاين</option></select></div><input name="note" placeholder="ملاحظة" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />{state?.message && <p className="text-sm text-red-600">{state.message}</p>}<button type="submit" disabled={pending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{pending ? "جاري التسجيل..." : "حفظ الحضور"}</button></form>;
}
