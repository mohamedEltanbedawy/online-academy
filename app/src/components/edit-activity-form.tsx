"use client";

import { useActionState } from "react";
import { updateActivity, type ActivityActionState } from "@/app/actions/activities";

export function EditActivityForm({ activity }: { activity: { id: string; title: string; type: string; description: string | null; location: string | null; capacity: number; scheduledAt: string } }) {
  const [state, action, pending] = useActionState<ActivityActionState, FormData>(updateActivity, undefined);
  return <form action={action} className="space-y-3"><input type="hidden" name="id" value={activity.id} /><input name="title" required defaultValue={activity.title} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><div className="grid gap-3 sm:grid-cols-2"><input name="type" required defaultValue={activity.type} className="rounded-lg border border-slate-300 px-3 py-2" /><input name="location" defaultValue={activity.location ?? ""} className="rounded-lg border border-slate-300 px-3 py-2" /></div><textarea name="description" rows={3} defaultValue={activity.description ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><div className="grid gap-3 sm:grid-cols-2"><input name="scheduledAt" type="datetime-local" defaultValue={activity.scheduledAt} className="rounded-lg border border-slate-300 px-3 py-2" /><input name="capacity" type="number" min="1" defaultValue={activity.capacity} className="rounded-lg border border-slate-300 px-3 py-2" /></div>{state?.message && <p className="text-sm text-red-600">{state.message}</p>}<button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ الفعالية"}</button></form>;
}
