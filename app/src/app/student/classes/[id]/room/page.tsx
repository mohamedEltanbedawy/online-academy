import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveRoom } from "@/components/live-room";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const student = await requireRole("STUDENT");
  const { id } = await params;
  const enrollment = await prisma.enrollment.findFirst({
    where: { classId: id, studentId: student.id, status: "ACTIVE" },
    include: { class: { select: { id: true, name: true, subject: true } } },
  });

  if (!enrollment) notFound();

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{enrollment.class.name}</h1>
            <p className="text-slate-600">{enrollment.class.subject} — قاعة الطالب</p>
          </div>
          <Link href={`/student/classes/${enrollment.class.id}`} className="text-sm text-slate-500 hover:underline">
            → تفاصيل الفصل
          </Link>
        </header>
        <LiveRoom classId={enrollment.class.id} role="STUDENT" />
      </div>
    </main>
  );
}
