import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

const roleNames: Record<string, string> = {
  TEACHER: "مدرس",
  STUDENT: "طالب",
  ADMIN: "مشرف عام",
  CASHIER: "موظف منفذ بيع",
};

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <AppShell title="ملفي الشخصي">
      <section className="section-card">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">الاسم</dt>
            <dd className="font-semibold text-slate-900">{user.name}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">الإيميل</dt>
            <dd className="font-semibold text-slate-900" dir="ltr">
              {user.email}
            </dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">الموبايل</dt>
            <dd className="font-semibold text-slate-900" dir="ltr">
              {user.phone}
            </dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">نوع الحساب</dt>
            <dd className="font-semibold text-blue-600">
              {roleNames[user.role] ?? user.role}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">تاريخ التسجيل</dt>
            <dd className="font-semibold text-slate-900">
              {user.createdAt.toLocaleDateString("ar-EG")}
            </dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}
