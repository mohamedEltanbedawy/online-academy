"use client";

import { useActionState } from "react";
import { updateHomework, type AdminActionState } from "@/app/actions/admin";

export function AdminEditHomeworkForm({ homework }: { homework: { id: string; title: string; instructions: string; maxScore: number; dueAt: string } }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateHomework, undefined);
  return <form action={action} className="space-y-4"><input type="hidden" name="id" value={homework.id} /><input name="title" required defaultValue={homework.title} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><textarea name="instructions" required defaultValue={homework.instructions} rows={6} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><div className="grid gap-3 sm:grid-cols-2"><input name="maxScore" type="number" min="1" max="1000" defaultValue={homework.maxScore} className="rounded-lg border border-slate-300 px-3 py-2" /><input name="dueAt" type="datetime-local" defaultValue={homework.dueAt} className="rounded-lg border border-slate-300 px-3 py-2" /></div>{state?.message && <p className="text-sm text-red-600">{state.message}</p>}<button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ الواجب"}</button></form>;
}
