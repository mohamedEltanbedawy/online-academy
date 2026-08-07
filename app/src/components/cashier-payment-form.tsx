"use client";

import { useActionState } from "react";
import { recordCashierPayment, type PaymentActionState } from "@/app/actions/payments";

type ClassOption = { id: string; label: string };

export function CashierPaymentForm({ classes }: { classes: ClassOption[] }) {
  const [state, action, pending] = useActionState<PaymentActionState, FormData>(recordCashierPayment, undefined);
  return <form action={action} className="space-y-4">
    {state?.message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
    <div><label htmlFor="studentLookup" className="mb-1 block text-sm font-medium text-slate-700">إيميل أو موبايل الطالب</label><input id="studentLookup" name="studentLookup" required placeholder="student@example.com أو 011..." dir="ltr" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />{state?.errors?.studentLookup && <p className="mt-1 text-sm text-red-600">{state.errors.studentLookup[0]}</p>}</div>
    <div><label htmlFor="classId" className="mb-1 block text-sm font-medium text-slate-700">الفصل</label><select id="classId" name="classId" required defaultValue="" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"><option value="">اختر الفصل</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>{state?.errors?.classId && <p className="mt-1 text-sm text-red-600">{state.errors.classId[0]}</p>}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">المبلغ (ج.م)</label><input id="amount" name="amount" type="number" min="0.01" step="0.01" required placeholder="150.00" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />{state?.errors?.amount && <p className="mt-1 text-sm text-red-600">{state.errors.amount[0]}</p>}</div><div><label htmlFor="method" className="mb-1 block text-sm font-medium text-slate-700">طريقة الدفع</label><select id="method" name="method" required defaultValue="CASH" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"><option value="CASH">كاش</option><option value="MOBILE_WALLET">محفظة إلكترونية</option><option value="BANK_TRANSFER">تحويل بنكي</option><option value="GATEWAY">بوابة دفع</option></select></div></div>
    <div><label className="mb-1 block text-sm font-medium text-slate-700">مصدر الطالب</label><div className="grid gap-3 sm:grid-cols-2"><label className="rounded-lg border border-slate-300 p-3"><input type="radio" name="source" value="PLATFORM" required /> جاي من المنصة</label><label className="rounded-lg border border-slate-300 p-3"><input type="radio" name="source" value="TEACHER" required /> جاي مع المدرس</label></div>{state?.errors?.source && <p className="mt-1 text-sm text-red-600">{state.errors.source[0]}</p>}</div>
    <div><label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">ملاحظات (اختياري)</label><input id="description" name="description" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /></div>
    <button type="submit" disabled={pending} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{pending ? "جاري تسجيل الدفع..." : "تسجيل الدفع وتفعيل الطالب"}</button>
  </form>;
}
