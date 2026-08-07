"use client";

import { useActionState } from "react";
import { createChildAsAdmin, type ChildActionState } from "@/app/actions/children";

type GuardianOption = { id: string; name: string; phone: string };

export function AdminCreateChildForm({ guardianOptions }: { guardianOptions: GuardianOption[] }) {
  const [state, action, pending] = useActionState<ChildActionState, FormData>(createChildAsAdmin, undefined);
  return <form action={action} className="space-y-4"><div><input name="name" required placeholder="اسم الطفل كاملًا" className="w-full rounded-lg border border-slate-300 px-3 py-2" />{state?.errors?.name && <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>}</div><div><input name="birthDate" required type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" />{state?.errors?.birthDate && <p className="mt-1 text-sm text-red-600">{state.errors.birthDate[0]}</p>}</div><select name="guardianId" defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">بدون ولي أمر (أضف لاحقًا)</option>{guardianOptions.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.name} ({guardian.phone})</option>)}</select><input name="stage" placeholder="المرحلة التعليمية (اختياري)" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><input name="schoolGrade" placeholder="الصف الدراسي (اختياري)" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><textarea name="notes" rows={2} placeholder="ملاحظات عامة (اختياري)" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><textarea name="medicalNotes" rows={2} placeholder="ملاحظات طبية (اختياري)" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "إضافة الطفل"}</button></form>;
}
