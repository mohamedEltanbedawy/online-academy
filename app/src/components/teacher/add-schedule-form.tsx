"use client";

import { useActionState } from "react";
import { DAY_LABELS } from "@/lib/format";
import { addSchedule, type ClassActionState } from "@/app/actions/classes";

export function AddScheduleForm({ classId }: { classId: string }) {
  const [state, action, pending] = useActionState<ClassActionState, FormData>(
    addSchedule.bind(null, classId),
    undefined
  );

  return (
    <form action={action} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      {state?.message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {state.message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
            اسم الحصة (اختياري)
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="مثال: حصة الجبر"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="dayOfWeek" className="mb-1 block text-sm font-medium text-slate-700">
            اليوم
          </label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            required
            defaultValue="0"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          >
            {DAY_LABELS.map((label, index) => (
              <option key={index} value={index}>
                {label}
              </option>
            ))}
          </select>
          {state?.errors?.dayOfWeek && (
            <p className="mt-1 text-sm text-red-600">{state.errors.dayOfWeek[0]}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="startTime" className="mb-1 block text-sm font-medium text-slate-700">
            وقت البداية
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          {state?.errors?.startTime && (
            <p className="mt-1 text-sm text-red-600">{state.errors.startTime[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="durationMinutes"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            المدة (دقائق)
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min="1"
            max="600"
            defaultValue="60"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          {state?.errors?.durationMinutes && (
            <p className="mt-1 text-sm text-red-600">{state.errors.durationMinutes[0]}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "جاري الإضافة..." : "إضافة الحصة للجدول"}
      </button>
    </form>
  );
}
