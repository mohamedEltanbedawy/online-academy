"use client";

import { useActionState } from "react";
import { updateAcademyProgram, type AcademyActionState } from "@/app/actions/academy";

export function EditProgramForm({ program }: { program: { id: string; title: string; description: string | null; objectives: string | null } }) {
  const [state, action, pending] = useActionState<AcademyActionState, FormData>(updateAcademyProgram, undefined);
  return <form action={action} className="space-y-3"><input type="hidden" name="id" value={program.id} /><input name="title" required defaultValue={program.title} className="w-full rounded-lg border border-slate-300 px-3 py-2" />{state?.errors?.title && <p className="text-sm text-red-600">{state.errors.title[0]}</p>}<textarea name="description" defaultValue={program.description ?? ""} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" /><textarea name="objectives" defaultValue={program.objectives ?? ""} rows={3} placeholder="الأهداف والمخرجات" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ البرنامج"}</button></form>;
}
