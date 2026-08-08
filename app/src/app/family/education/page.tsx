import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyChildren } from "@/lib/family";

export default async function FamilyEducationPage() {
  const user = await requireUser();
  if (user.role !== "PARENT" && user.role !== "ADMIN" && user.role !== "STAFF") redirect("/dashboard");

  const children = await getMyChildren();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">التعليم المنزلي</h1>
      <p className="text-slate-600">اختر الطفل لمتابعة مواده وحصصه وجدوله</p>

      {children.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-8 text-center">
          <p className="text-slate-500">لا يوجد أطفال مضافين حتى الآن</p>
          <p className="mt-2 text-sm text-slate-400">أضف طفلًا من لوحة الأسرة أولاً</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/family/education/${child.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                  {child.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{child.name}</h3>
                  <p className="text-sm text-slate-500">{child.schoolGrade || child.stage || ""}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 text-xs text-slate-400">
                <span>المواد</span>
                <span>·</span>
                <span>الحصص</span>
                <span>·</span>
                <span>الجدول</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link href="/family" className="text-sm text-blue-600 hover:text-blue-800">العودة للوحة الأسرة</Link>
      </div>
    </div>
  );
}
