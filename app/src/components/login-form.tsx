"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/app/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
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
        <label htmlFor="email" className="label">الإيميل</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="example@email.com"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">الباسورد</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="********"
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? "جاري الدخول..." : "دخول"}
      </button>

      <p className="text-center text-sm text-slate-600">
        معندكش حساب؟{" "}
        <Link href="/auth/register" className="font-semibold text-blue-600 hover:underline">
          سجّل دلوقتي
        </Link>
      </p>
    </form>
  );
}
