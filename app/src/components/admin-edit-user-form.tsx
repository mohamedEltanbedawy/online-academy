"use client";

import { useActionState } from "react";
import { updateUser, type AdminActionState } from "@/app/actions/admin";

export function AdminEditUserForm({ user }: { user: { id: string; name: string; phone: string; role: string } }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateUser, undefined);
  return <form action={action} className="space-y-4"><input type="hidden" name="id" value={user.id} /><input name="name" required defaultValue={user.name} placeholder="الاسم" className="w-full rounded-lg border border-slate-300 px-3 py-2" />{state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}<input name="phone" required defaultValue={user.phone} dir="ltr" className="w-full rounded-lg border border-slate-300 px-3 py-2" />{state?.errors?.phone && <p className="text-sm text-red-600">{state.errors.phone[0]}</p>}<select name="role" defaultValue={user.role} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="STUDENT">طالب</option><option value="TEACHER">مدرس</option><option value="PARENT">ولي أمر</option><option value="STAFF">أخصائي</option><option value="CASHIER">كاشير</option><option value="ADMIN">أدمن</option></select>{state?.message && <p className="text-sm text-red-600">{state.message}</p>}<button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ الحساب"}</button></form>;
}
