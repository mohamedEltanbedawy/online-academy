"use client";

import { useActionState } from "react";
import { createHomework, type HomeworkActionState } from "@/app/actions/homework";

export function CreateHomeworkForm({ classId }: { classId: string }) {
  const [state, action, pending] = useActionState<HomeworkActionState, FormData>(
    createHomework,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="classId" value={classId} />
      {state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">عنوان الواجب</label>
        <input id="title" name="title" required placeholder="حل تدريبات الوحدة الأولى" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        {state?.errors?.title && <p className="mt-1 text-sm text-red-600">{state.errors.title[0]}</p>}
      </div>
      <div>
        <label htmlFor="instructions" className="mb-1 block text-sm font-medium text-slate-700">التعليمات</label>
        <textarea id="instructions" name="instructions" required rows={5} placeholder="اكتب المطلوب من الطالب بالتفصيل..." className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        {state?.errors?.instructions && <p className="mt-1 text-sm text-red-600">{state.errors.instructions[0]}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dueAt" className="mb-1 block text-sm font-medium text-slate-700">موعد التسليم (اختياري)</label>
          <input id="dueAt" name="dueAt" type="datetime-local" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {state?.errors?.dueAt && <p className="mt-1 text-sm text-red-600">{state.errors.dueAt[0]}</p>}
        </div>
        <div>
          <label htmlFor="maxScore" className="mb-1 block text-sm font-medium text-slate-700">الدرجة النهائية</label>
          <input id="maxScore" name="maxScore" type="number" min="1" max="1000" defaultValue="100" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {state?.errors?.maxScore && <p className="mt-1 text-sm text-red-600">{state.errors.maxScore[0]}</p>}
        </div>
      </div>
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {pending ? "جاري إنشاء الواجب..." : "إنشاء الواجب"}
      </button>
    </form>
  );
}
