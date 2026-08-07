"use client";

import { useFormStatus } from "react-dom";
import { logout } from "@/app/actions/auth";

function LogoutButtonInner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "جاري الخروج..." : "تسجيل الخروج"}
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <LogoutButtonInner />
    </form>
  );
}
