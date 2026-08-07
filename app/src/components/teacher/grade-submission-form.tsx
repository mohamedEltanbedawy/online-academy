"use client";

import { useActionState } from "react";
import { gradeSubmission, type HomeworkActionState } from "@/app/actions/homework";

export function GradeSubmissionForm({ submissionId, maxScore, score, feedback }: { submissionId: string; maxScore: number; score: number | null; feedback: string }) {
  const [state, action, pending] = useActionState<HomeworkActionState, FormData>(
    gradeSubmission.bind(null, submissionId),
    undefined
  );

  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
      {state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`score-${submissionId}`} className="mb-1 block text-sm font-medium text-slate-700">الدرجة من {maxScore}</label>
          <input id={`score-${submissionId}`} name="score" type="number" min="0" max={maxScore} required defaultValue={score ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {state?.errors?.score && <p className="mt-1 text-sm text-red-600">{state.errors.score[0]}</p>}
        </div>
        <div>
          <label htmlFor={`feedback-${submissionId}`} className="mb-1 block text-sm font-medium text-slate-700">تعليق المدرس</label>
          <input id={`feedback-${submissionId}`} name="feedback" defaultValue={feedback} placeholder="شغل ممتاز..." className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ التصحيح"}</button>
    </form>
  );
}
