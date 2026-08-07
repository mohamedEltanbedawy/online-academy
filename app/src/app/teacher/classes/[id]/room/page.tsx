import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveRoom } from "@/components/live-room";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeacherRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireRole("TEACHER");
  const { id } = await params;
  const cls = await prisma.class.findFirst({
    where: { id, teacherId: teacher.id },
    select: { id: true, name: true, subject: true },
  });

  if (!cls) notFound();

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{cls.name}</h1>
            <p className="text-slate-600">{cls.subject} — وضع المدرس</p>
          </div>
          <Link href={`/teacher/classes/${cls.id}`} className="text-sm text-slate-500 hover:underline">
            → تفاصيل الفصل
          </Link>
        </header>
        <LiveRoom classId={cls.id} role="TEACHER" />
      </div>
    </main>
  );
}
