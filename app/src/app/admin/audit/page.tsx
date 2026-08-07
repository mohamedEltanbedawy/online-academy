import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const actions: Record<string, string> = { ACTIVATE_USER: "تفعيل مستخدم", DEACTIVATE_USER: "إيقاف مستخدم", ARCHIVE_CLASS: "أرشفة فصل", RESTORE_CLASS: "إرجاع فصل" };

export default async function AdminAuditPage() {
  await requireRole("ADMIN");
  const logs = await prisma.auditLog.findMany({ include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <AppShell
      title="سجل النشاط الإداري"
      subtitle="كل تعديل إداري مسجل بالفاعل والتوقيت."
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الإجراء</th>
              <th>المدير</th>
              <th>العنصر</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="font-semibold">{actions[log.action] ?? log.action}</td>
                <td>{log.actor.name}</td>
                <td>
                  {log.entity} / <span className="font-mono text-xs">{log.entityId}</span>
                </td>
                <td className="text-slate-500">{log.createdAt.toLocaleString("ar-EG")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
