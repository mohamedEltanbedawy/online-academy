"use client";

import { useActionState } from "react";
import { joinClass, type ClassActionState } from "@/app/actions/classes";

export function JoinClassForm({ initialCode }: { initialCode: string }) {
  const [state, action, pending] = useActionState<ClassActionState, FormData>(
    joinClass,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-700">
          كود الدعوة
        </label>
        <input
          id="code"
          name="code"
          type="text"
          required
          dir="ltr"
          defaultValue={initialCode}
          placeholder="AB12CD"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg font-bold tracking-widest outline-none focus:border-blue-500"
        />
        {state?.errors?.code && (
          <p className="mt-1 text-sm text-red-600">{state.errors.code[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          إزاي عرفت الفصل ده؟
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 p-3">
            <input
              type="radio"
              name="source"
              value="PLATFORM"
              required
              className="accent-blue-600"
            />
            <span className="text-sm text-slate-700">جاي عن طريق المنصة (الدعاية)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 p-3">
            <input
              type="radio"
              name="source"
              value="TEACHER"
              required
              className="accent-blue-600"
            />
            <span className="text-sm text-slate-700">جاي مع المدرس نفسه</span>
          </label>
        </div>
        {state?.errors?.source && (
          <p className="mt-1 text-sm text-red-600">{state.errors.source[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "جاري الانضمام..." : "الانضمام للفصل"}
      </button>
    </form>
  );
}
