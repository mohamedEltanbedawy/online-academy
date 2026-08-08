"use client";

import { useActionState } from "react";
import {
  createSubject,
  createLesson,
  createHomework,
  createScheduleEntry,
  type EducationActionState,
} from "@/app/actions/education";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500";
const labelCls = "mb-1 block text-sm font-medium text-slate-700";
const errCls = "mt-1 text-sm text-red-600";
const btnCls = "btn-primary";

const SUBJECT_TYPES: Record<string, string> = {
  SCHOOL: "مدرسي",
  ENGLISH: "إنجليزي",
  SOFT_SKILLS: "سوفت سكيلز",
  COMPUTER: "كمبيوتر",
  PROGRAMMING: "برمجة",
};

const DAYS = ["الجمعة", "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const SCHEDULE_TYPES: Record<string, string> = { LESSON: "حصة", HOMEWORK: "وقت واجب", EXERCISE: "وقت تمرين" };

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ===== نموذج إضافة مادة =====
export function SubjectForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState<EducationActionState, FormData>(createSubject, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>اسم المادة</label>
          <input name="name" required className={inputCls} placeholder="مثال: رياضيات مدرسية" />
          {state?.errors?.name && <p className={errCls}>{state.errors.name[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>النوع</label>
          <select name="type" className={inputCls}>
            {Object.entries(SUBJECT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>اسم الكتاب</label>
          <input name="bookTitle" className={inputCls} placeholder="اسم الكتاب الدراسي" />
        </div>
        <div>
          <label className={labelCls}>المدرس</label>
          <input name="teacher" className={inputCls} placeholder="اسم مدرس الحصص" />
        </div>
      </div>
      <div>
        <label className={labelCls}>وصف المادة</label>
        <textarea name="description" rows={2} className={inputCls} placeholder="أهداف المادة ومحتواها العام" />
      </div>
      <button disabled={pending} className={btnCls}>{pending ? "جاري الحفظ..." : "إضافة مادة"}</button>
    </form>
  );
}

// ===== نموذج تسجيل حصة =====
export function LessonForm({ childId, subjects }: { childId: string; subjects: { id: string; name: string; teacher: string | null }[] }) {
  const [state, action, pending] = useActionState<EducationActionState, FormData>(createLesson, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>المادة</label>
          <select name="subjectId" required className={inputCls}>
            <option value="">-- اختر المادة --</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.teacher ? ` (${s.teacher})` : ""}</option>)}
          </select>
          {state?.errors?.subjectId && <p className={errCls}>{state.errors.subjectId[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>التاريخ</label>
          <input name="date" type="date" required defaultValue={todayInput()} className={inputCls} />
          {state?.errors?.date && <p className={errCls}>{state.errors.date[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>الوقت</label>
          <input name="startTime" type="time" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>المدة (دقيقة)</label>
          <input name="duration" type="number" placeholder="60" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>المدرس (اختياري)</label>
          <input name="teacher" className={inputCls} placeholder="اسم من شرح الحصة" />
        </div>
      </div>
      <div>
        <label className={labelCls}>محتوى الحصة: ايه اتشرح؟</label>
        <textarea name="content" required rows={4} className={inputCls} placeholder="اكتب تفاصيل الدرس والنقاط اللي اتعلمها" />
        {state?.errors?.content && <p className={errCls}>{state.errors.content[0]}</p>}
      </div>
      <div>
        <label className={labelCls}>ملاحظات</label>
        <textarea name="notes" rows={2} className={inputCls} />
      </div>
      <button disabled={pending} className={btnCls}>{pending ? "جاري الحفظ..." : "تسجيل الحصة"}</button>
    </form>
  );
}

// ===== نموذج إضافة واجب =====
export function HomeworkForm({ lessonId, childId }: { lessonId: string; childId: string }) {
  const [state, action, pending] = useActionState<EducationActionState, FormData>(createHomework, undefined);
  return (
    <form action={action} className="space-y-3 mt-4 border-t pt-4">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div>
        <label className={labelCls}>وصف الواجب</label>
        <textarea name="description" required rows={3} className={inputCls} placeholder="مثلاً: حل 5 مسائل من صفحة 20" />
        {state?.errors?.description && <p className={errCls}>{state.errors.description[0]}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>آخر موعد للتسليم</label>
          <input name="dueDate" type="date" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>ملاحظات للواجب</label>
          <input name="notes" className={inputCls} />
        </div>
      </div>
      <button disabled={pending} className={btnCls}>{pending ? "جاري الحفظ..." : "إضافة الواجب"}</button>
    </form>
  );
}

// ===== نموذج بند الجدول الأسبوعي =====
export function ScheduleEntryForm({ childId, subjects }: { childId: string; subjects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<EducationActionState, FormData>(createScheduleEntry, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>اليوم</label>
          <select name="dayOfWeek" className={inputCls}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>النوع</label>
          <select name="type" className={inputCls}>
            {Object.entries(SCHEDULE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>العنوان</label>
          <input name="label" required className={inputCls} placeholder="مثلاً: حصة رياضيات" />
          {state?.errors?.label && <p className={errCls}>{state.errors.label[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>المادة (اختياري)</label>
          <select name="subjectId" className={inputCls}>
            <option value="">-- بدون مادة --</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>وقت البداية</label>
          <input name="startTime" type="time" required className={inputCls} />
          {state?.errors?.startTime && <p className={errCls}>{state.errors.startTime[0]}</p>}
        </div>
        <div>
          <label className={labelCls}>وقت النهاية (اختياري)</label>
          <input name="endTime" type="time" className={inputCls} />
        </div>
      </div>
      <button disabled={pending} className={btnCls}>{pending ? "جاري الحفظ..." : "إضافة البند"}</button>
    </form>
  );
}
