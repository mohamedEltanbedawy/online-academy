"use client";

import { useActionState } from "react";
import { createClass, type ClassActionState } from "@/app/actions/classes";

export type CreateClassDefaults = {
  subject: string;
  defaultHourlyRate: number;
  defaultPlatformPercent: number;
  defaultFixedFee: number;
};

export function CreateClassForm({ defaults }: { defaults: CreateClassDefaults }) {
  const [state, action, pending] = useActionState<ClassActionState, FormData>(
    createClass,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            اسم الفصل
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="مثال: رياضيات — الصف الثالث الإعدادي"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          {state?.errors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">
            المادة
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            defaultValue={defaults.subject}
            placeholder="رياضيات"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          {state?.errors?.subject && (
            <p className="mt-1 text-sm text-red-600">{state.errors.subject[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
          وصف الفصل (اختياري)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="شرح المنهج كاملاً + مراجعات شهرية..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">نموذج الربح في الفصل</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="pricePerHour"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              سعر الحصة للطالب (ج.م)
            </label>
            <input
              id="pricePerHour"
              name="pricePerHour"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={defaults.defaultHourlyRate}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
            {state?.errors?.pricePerHour && (
              <p className="mt-1 text-sm text-red-600">{state.errors.pricePerHour[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="platformPercent"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              نسبة المنصة لطلبة الدعاية (٪)
            </label>
            <input
              id="platformPercent"
              name="platformPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={defaults.defaultPlatformPercent}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
            {state?.errors?.platformPercent && (
              <p className="mt-1 text-sm text-red-600">{state.errors.platformPercent[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="fixedFee"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              الكلفة الثابتة لطالب المدرس (ج.م)
            </label>
            <input
              id="fixedFee"
              name="fixedFee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaults.defaultFixedFee}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
            {state?.errors?.fixedFee && (
              <p className="mt-1 text-sm text-red-600">{state.errors.fixedFee[0]}</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          طالب جاي من دعاية المنصة → المنصة بتاخد نسبة من سعر الحصة. طالب جاي معاك بنفسك →
          المنصة بتاخد كلفة ثابتة صغيرة لكل حصة.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "جاري إنشاء الفصل..." : "إنشاء الفصل"}
      </button>
    </form>
  );
}
