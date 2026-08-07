import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { CreateClassForm } from "@/components/teacher/create-class-form";

export const dynamic = "force-dynamic";

export default async function NewClassPage() {
  const teacher = await requireRole("TEACHER");
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: teacher.id },
  });

  if (!profile) {
    return (
      <AppShell title="إنشاء فصل جديد">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center">
          <h2 className="text-lg font-bold text-amber-900">كمّل بياناتك الأول</h2>
          <p className="mt-2 text-sm text-amber-800">
            عشان تعمل فصل جديد لازم تكمل بياناتك (المادة والأسعار) الأول.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/teacher/profile" className="btn-amber">
              كمّل بياناتي
            </Link>
            <Link href="/teacher" className="btn-outline">
              الرجوع
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="إنشاء فصل جديد"
      subtitle="الفصل بيجمع طلبتك في مادة معينة، وبتختار فيه نموذج الربح."
      maxWidth="max-w-2xl"
    >
      <section className="section-card">
        <CreateClassForm
          defaults={{
            subject: profile.subject,
            defaultHourlyRate: profile.defaultHourlyRate.toNumber(),
            defaultPlatformPercent: profile.defaultPlatformPercent.toNumber(),
            defaultFixedFee: profile.defaultFixedFee.toNumber(),
          }}
        />
      </section>
    </AppShell>
  );
}
