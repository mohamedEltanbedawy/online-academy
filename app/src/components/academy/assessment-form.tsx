"use client";

import { useActionState } from "react";
import { createChildAssessment, type AcademyActionState } from "@/app/actions/academy";

type Option = { id: string; label: string };

export function AssessmentForm({ childId, skills }: { childId: string; skills: Option[] }) {
  const [state, action, pending] = useActionState<AcademyActionState, FormData>(createChildAssessment, undefined);
  return <form action={action} className="space-y-3"><input type="hidden" name="childId" value={childId} />{state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}<div className="grid gap-3 sm:grid-cols-2"><select name="skillId" required defaultValue="" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"><option value="">اختر المهارة</option>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.label}</option>)}</select><input name="score" type="number" min="0" max="100" required placeholder="الدرجة من 100" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /></div>{state?.errors?.score && <p className="text-sm text-red-600">{state.errors.score[0]}</p>}<textarea name="notes" rows={2} placeholder="ملاحظات وخطة تحسين..." className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /><button type="submit" disabled={pending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{pending ? "جاري التسجيل..." : "تسجيل التقييم"}</button></form>;
}
