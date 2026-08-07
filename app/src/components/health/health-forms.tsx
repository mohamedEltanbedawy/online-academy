"use client";

import { useActionState, useState } from "react";
import {
  createGrowthRecord,
  createVaccination,
  createSleepRecord,
  createNutritionRecord,
  createMedicine,
  type HealthActionState,
} from "@/app/actions/health";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500";
const labelCls = "mb-1 block text-sm font-medium text-slate-700";
const errCls = "mt-1 text-sm text-red-600";

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ===== النمو =====
export function GrowthForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState<HealthActionState, FormData>(createGrowthRecord, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>التاريخ</label>
          <input name="date" type="date" defaultValue={todayInput()} className={inputCls} />
          {state?.errors?.date && <p className={errCls}>{state.errors.date[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>الوزن (كجم)</label>
          <input name="weightKg" type="number" step="0.1" placeholder="12.5" className={inputCls} />
          {state?.errors?.weightKg && <p className={errCls}>{state.errors.weightKg[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>الطول (سم)</label>
          <input name="heightCm" type="number" step="0.1" placeholder="95" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>محيط الرأس (سم)</label>
          <input name="headCm" type="number" step="0.1" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>ملاحظات</label>
        <textarea name="notes" rows={2} className={inputCls} />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "جاري الحفظ..." : "إضافة قياس"}</button>
    </form>
  );
}

// ===== التطعيم =====
export function VaccinationForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState<HealthActionState, FormData>(createVaccination, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>اسم التطعيم</label>
          <input name="name" required placeholder="مثال: ثلاثي بكتيري" className={inputCls} />
          {state?.errors?.name && <p className={errCls}>{state.errors.name[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>الجرعة</label>
          <input name="dose" placeholder="مثال: جرعة ثانية" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>تاريخ التطعيم</label>
          <input name="date" type="date" required className={inputCls} />
          {state?.errors?.date && <p className={errCls}>{state.errors.date[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>الجرعة القادمة (اختياري)</label>
          <input name="nextDueDate" type="date" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>ملاحظات</label>
        <textarea name="notes" rows={2} className={inputCls} />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "جاري الحفظ..." : "إضافة التطعيم"}</button>
    </form>
  );
}

// ===== النوم =====
export function SleepForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState<HealthActionState, FormData>(createSleepRecord, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>التاريخ</label>
          <input name="date" type="date" defaultValue={todayInput()} className={inputCls} />
          {state?.errors?.date && <p className={errCls}>{state.errors.date[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>الساعات</label>
          <input name="hours" type="number" step="0.5" placeholder="8" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>الجودة</label>
          <select name="quality" className={inputCls}>
            <option value="">—</option>
            <option value="جيدة">جيدة</option>
            <option value="متوسطة">متوسطة</option>
            <option value="سيئة">سيئة</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>ملاحظات</label>
        <textarea name="notes" rows={2} className={inputCls} />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "جاري الحفظ..." : "إضافة سجل النوم"}</button>
    </form>
  );
}

// ===== الغذاء =====
export function NutritionForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState<HealthActionState, FormData>(createNutritionRecord, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>التاريخ</label>
          <input name="date" type="date" defaultValue={todayInput()} className={inputCls} />
          {state?.errors?.date && <p className={errCls}>{state.errors.date[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>الوجبة</label>
          <select name="meal" className={inputCls}>
            <option value="فطار">فطار</option>
            <option value="غدا">غدا</option>
            <option value="عشا">عشا</option>
            <option value="سناك">سناك</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>الأطعمة المتناولة</label>
        <textarea name="foods" required rows={2} placeholder="مثال: أرز، فراخ مشوية، خضار" className={inputCls} />
        {state?.errors?.foods && <p className={errCls}>{state.errors.foods[0]}</p>}
      </div>
      <div>
        <label className={labelCls}>ملاحظات</label>
        <textarea name="notes" rows={2} className={inputCls} />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "جاري الحفظ..." : "إضافة سجل الغذاء"}</button>
    </form>
  );
}

// ===== الأدوية =====
export function MedicineForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState<HealthActionState, FormData>(createMedicine, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>اسم الدواء</label>
          <input name="name" required placeholder="مثال: باراسيتامول" className={inputCls} />
          {state?.errors?.name && <p className={errCls}>{state.errors.name[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>الجرعة</label>
          <input name="dosage" placeholder="مثال: 5 مل" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>التكرار</label>
          <input name="frequency" placeholder="مثال: كل 8 ساعات" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>من</label>
            <input name="startDate" type="date" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>إلى</label>
            <input name="endDate" type="date" className={inputCls} />
          </div>
        </div>
      </div>
      <div>
        <label className={labelCls}>ملاحظات</label>
        <textarea name="notes" rows={2} className={inputCls} />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "جاري الحفظ..." : "إضافة الدواء"}</button>
    </form>
  );
}

// ===== اختيار نوع الإدخال (تبويب) =====
export function HealthTabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setActive(t.id)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active === t.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.map((t) => (
          <div key={t.id} className={active === t.id ? "block" : "hidden"}>{t.content}</div>
        ))}
      </div>
    </div>
  );
}
