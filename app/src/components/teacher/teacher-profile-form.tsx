"use client";

import { useActionState } from "react";
import {
  updateTeacherProfile,
  type TeacherActionState,
} from "@/app/actions/teacher";

export type TeacherProfileValues = {
  subject: string;
  bio: string;
  defaultHourlyRate: number;
  defaultPlatformPercent: number;
  defaultFixedFee: number;
};

export function TeacherProfileForm({ initial }: { initial: TeacherProfileValues }) {
  const [state, action, pending] = useActionState<TeacherActionState, FormData>(
    updateTeacherProfile,
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
        <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">
          المادة الأساسية
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          defaultValue={initial.subject}
          placeholder="رياضيات"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
        />
        {state?.errors?.subject && (
          <p className="mt-1 text-sm text-red-600">{state.errors.subject[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-slate-700">
          وصفك (اختياري)
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={initial.bio}
          placeholder="خبرتي في تدريس المادة..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="defaultHourlyRate"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            سعر الحصة الافتراضي (ج.م)
          </label>
          <input
            id="defaultHourlyRate"
            name="defaultHourlyRate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initial.defaultHourlyRate}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          {state?.errors?.defaultHourlyRate && (
            <p className="mt-1 text-sm text-red-600">{state.errors.defaultHourlyRate[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="defaultPlatformPercent"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            نسبة المنصة لطلبة الدعاية (٪)
          </label>
          <input
            id="defaultPlatformPercent"
            name="defaultPlatformPercent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={initial.defaultPlatformPercent}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          {state?.errors?.defaultPlatformPercent && (
            <p className="mt-1 text-sm text-red-600">
              {state.errors.defaultPlatformPercent[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="defaultFixedFee"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            الكلفة الثابتة لطالب المدرس (ج.م)
          </label>
          <input
            id="defaultFixedFee"
            name="defaultFixedFee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initial.defaultFixedFee}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          {state?.errors?.defaultFixedFee && (
            <p className="mt-1 text-sm text-red-600">{state.errors.defaultFixedFee[0]}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "جاري الحفظ..." : "حفظ البيانات"}
      </button>
    </form>
  );
}
