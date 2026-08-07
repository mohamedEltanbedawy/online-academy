"use client";

import { useActionState } from "react";
import { createEvent, type FamilyActionState } from "@/app/actions/family";

const eventTypes = [
  { value: "LESSON", label: "حصة" },
  { value: "ACTIVITY", label: "نشاط" },
  { value: "APPOINTMENT", label: "موعد" },
  { value: "BIRTHDAY", label: "عيد ميلاد" },
  { value: "CUSTOM", label: "مناسبة خاصة" },
];

export function EventForm({ families }: { families: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FamilyActionState, FormData>(createEvent, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">عنوان الحدث</label>
        <input id="title" name="title" required placeholder="مثال: موعد طبيب الأسنان" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        {state?.errors?.title && <p className="mt-1 text-sm text-red-600">{state.errors.title[0]}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-slate-700">النوع</label>
          <select id="type" name="type" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500">
            {eventTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {families.length > 1 && (
          <div>
            <label htmlFor="familyId" className="mb-1 block text-sm font-medium text-slate-700">العائلة</label>
            <select id="familyId" name="familyId" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500">
              <option value="">كل العائلة</option>
              {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="startsAt" className="mb-1 block text-sm font-medium text-slate-700">الموعد</label>
          <input id="startsAt" name="startsAt" type="datetime-local" required className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {state?.errors?.startsAt && <p className="mt-1 text-sm text-red-600">{state.errors.startsAt[0]}</p>}
        </div>
        <div>
          <label htmlFor="endsAt" className="mb-1 block text-sm font-medium text-slate-700">الانتهاء (اختياري)</label>
          <input id="endsAt" name="endsAt" type="datetime-local" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium text-slate-700">المكان (اختياري)</label>
          <input id="location" name="location" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">ملاحظات (اختياري)</label>
        <textarea id="notes" name="notes" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "جاري الإضافة..." : "إضافة الحدث"}</button>
    </form>
  );
}
