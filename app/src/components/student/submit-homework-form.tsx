"use client";

import { useActionState } from "react";
import { submitHomework, type HomeworkActionState } from "@/app/actions/homework";

export function SubmitHomeworkForm({ homeworkId, initialAnswer, disabled }: { homeworkId: string; initialAnswer: string; disabled: boolean }) {
  const [state, action, pending] = useActionState<HomeworkActionState, FormData>(
    submitHomework.bind(null, homeworkId),
    undefined
  );

  return (
    <form action={action} className="space-y-3">
      {state?.message && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{state.message}</p>}
      <textarea name="answer" required rows={8} defaultValue={initialAnswer} disabled={disabled || pending} placeholder="اكتب إجابتك هنا..." className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100" />
      {state?.errors?.answer && <p className="text-sm text-red-600">{state.errors.answer[0]}</p>}
      {!disabled && <button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{pending ? "جاري التسليم..." : "تسليم الحل"}</button>}
    </form>
  );
}
