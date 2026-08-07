"use client";

import { useActionState } from "react";
import { createSkill, type AcademyActionState } from "@/app/actions/academy";

export function SkillCreateForm() {
  const [state, action, pending] = useActionState<AcademyActionState, FormData>(createSkill, undefined);
  return <form action={action} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><div><input name="name" required placeholder="اسم المهارة" className="w-full rounded-lg border border-slate-300 px-3 py-2" />{state?.errors?.name && <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>}</div><div><input name="category" required placeholder="التصنيف (مثال: لغوي، حركي، اجتماعي)" className="w-full rounded-lg border border-slate-300 px-3 py-2" />{state?.errors?.category && <p className="mt-1 text-xs text-red-600">{state.errors.category[0]}</p>}</div></div><textarea name="description" rows={2} placeholder="وصف المهارة (اختياري)" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "إضافة المهارة"}</button></form>;
}
