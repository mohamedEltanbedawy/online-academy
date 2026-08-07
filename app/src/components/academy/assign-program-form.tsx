"use client";

import { useActionState } from "react";
import { assignChildProgram, type AcademyActionState } from "@/app/actions/academy";

type Option = { id: string; label: string };

export function AssignProgramForm({ childId, programs }: { childId: string; programs: Option[] }) {
  const [state, action, pending] = useActionState<AcademyActionState, FormData>(assignChildProgram, undefined);
  return <form action={action} className="space-y-3"><input type="hidden" name="childId" value={childId} />{state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}<select name="programId" required defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"><option value="">اختر برنامجًا</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.label}</option>)}</select><textarea name="customPlan" rows={3} placeholder="خطة مخصصة للطفل (نقاط قوة/ضعف وأهداف)..." className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /><button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{pending ? "جاري الحفظ..." : "تعيين البرنامج"}</button></form>;
}
