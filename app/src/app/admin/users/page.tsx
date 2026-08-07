import Link from "next/link";
import { toggleUserActive } from "@/app/actions/admin";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const roleNames: Record<string, string> = { STUDENT: "طالب", TEACHER: "مدرس", ADMIN: "إدارة", CASHIER: "كاشير", PARENT: "ولي أمر", STAFF: "أخصائي" };

export default async function AdminUsersPage() {
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <AppShell
      title="إدارة المستخدمين"
      subtitle="قائمة الحسابات وحالتها."
      actions={
        <Link href="/admin/users/new" className="btn btn-primary btn-sm">
          + حساب جديد
        </Link>
      }
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الإيميل</th>
              <th>الموبايل</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>التسجيل</th>
              <th>تحكم</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-semibold">{user.name}</td>
                <td dir="ltr">{user.email}</td>
                <td dir="ltr">{user.phone}</td>
                <td>{roleNames[user.role] ?? user.role}</td>
                <td>
                  <span className={user.active ? "badge badge-green" : "badge badge-red"}>
                    {user.active ? "نشط" : "موقوف"}
                  </span>
                </td>
                <td className="text-slate-500">{user.createdAt.toLocaleDateString("ar-EG")}</td>
                <td>
                  <div className="flex items-center gap-3">
                    {user.role !== "ADMIN" && (
                      <form action={toggleUserActive.bind(null, user.id)}>
                        <button type="submit" className={user.active ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-emerald"}>
                          {user.active ? "إيقاف" : "تفعيل"}
                        </button>
                      </form>
                    )}
                    <Link href={`/admin/users/${user.id}/edit`} className="font-semibold text-blue-600 hover:underline">
                      تعديل
                    </Link>
                    <Link href={`/admin/users/${user.id}/permissions`} className="font-semibold text-violet-600 hover:underline">
                      الصلاحيات
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
