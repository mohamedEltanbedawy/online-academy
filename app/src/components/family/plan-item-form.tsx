"use client";

import { useActionState } from "react";
import { createPlanItem, type FamilyActionState } from "@/app/actions/family";

const planTypes = [
  { value: "TASK", label: "مهمة" },
  { value: "LESSON", label: "حصة" },
  { value: "ACTIVITY", label: "نشاط" },
  { value: "REMINDER", label: "تذكير" },
];

export function PlanItemForm({ persons, defaultDay }: { persons: { id: string; fullName: string }[]; defaultDay?: string }) {
  const [state, action, pending] = useActionState<FamilyActionState, FormData>(createPlanItem, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">عنوان المهمة</label>
          <input id="title" name="title" required placeholder="مثال: مراجعة جدول الضرب" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {state?.errors?.title && <p className="mt-1 text-sm text-red-600">{state.errors.title[0]}</p>}
        </div>
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-slate-700">النوع</label>
          <select id="type" name="type" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500">
            {planTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="day" className="mb-1 block text-sm font-medium text-slate-700">اليوم</label>
          <input id="day" name="day" type="date" required defaultValue={defaultDay} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {state?.errors?.day && <p className="mt-1 text-sm text-red-600">{state.errors.day[0]}</p>}
        </div>
        <div>
          <label htmlFor="time" className="mb-1 block text-sm font-medium text-slate-700">الوقت (اختياري)</label>
          <input id="time" name="time" type="time" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="assignedToId" className="mb-1 block text-sm font-medium text-slate-700">المسؤول (اختياري)</label>
          <select id="assignedToId" name="assignedToId" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500">
            <option value="">الكل</option>
            {persons.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        </div>
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "جاري الإضافة..." : "إضافة للخطة"}</button>
    </form>
  );
}
