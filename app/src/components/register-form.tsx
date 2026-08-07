"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "@/app/actions/auth";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    register,
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
        <label htmlFor="name" className="label">الاسم الكامل</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="محمد أحمد"
          className="input"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="label">الإيميل</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="example@email.com"
          className="input"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="label">رقم الموبايل</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="01012345678"
          className="input"
        />
        {state?.errors?.phone && (
          <p className="mt-1 text-sm text-red-600">{state.errors.phone[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="label">الباسورد</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="8 حروف على الأقل"
          className="input"
        />
        {state?.errors?.password && (
          <p className="mt-1 text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="label">أنا...</label>
        <select
          id="role"
          name="role"
          required
          className="select"
        >
          <option value="">اختر نوع الحساب</option>
          <option value="STUDENT">طالب</option>
          <option value="TEACHER">مدرس</option>
        </select>
        {state?.errors?.role && (
          <p className="mt-1 text-sm text-red-600">{state.errors.role[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
      </button>

      <p className="text-center text-sm text-slate-600">
        عندك حساب؟{" "}
        <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline">
          ادخل من هنا
        </Link>
      </p>
    </form>
  );
}
