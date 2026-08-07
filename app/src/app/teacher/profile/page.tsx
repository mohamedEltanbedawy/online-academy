import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { TeacherProfileForm } from "@/components/teacher/teacher-profile-form";

export const dynamic = "force-dynamic";

export default async function TeacherProfilePage() {
  const teacher = await requireRole("TEACHER");
  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: teacher.id },
  });

  return (
    <AppShell
      title="بياناتي كمدرس"
      subtitle="دي البيانات اللي بتستخدمها كقيم افتراضية لما تعمل فصول جديدة."
      maxWidth="max-w-2xl"
    >
      <section className="section-card">
        <TeacherProfileForm
          initial={{
            subject: profile?.subject ?? "",
            bio: profile?.bio ?? "",
            defaultHourlyRate: profile?.defaultHourlyRate.toNumber() ?? 0,
            defaultPlatformPercent: profile?.defaultPlatformPercent.toNumber() ?? 0,
            defaultFixedFee: profile?.defaultFixedFee.toNumber() ?? 0,
          }}
        />
      </section>
    </AppShell>
  );
}
