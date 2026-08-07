import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { JoinClassForm } from "@/components/student/join-class-form";

export default async function JoinClassPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireRole("STUDENT");
  const params = await searchParams;

  return (
    <AppShell
      title="الانضمام لفصل"
      subtitle="اكتب كود الدعوة اللي وصلك من المدرس، واختر إزاي عرفت الفصل."
    >
      <section className="section-card">
        <JoinClassForm initialCode={params.code ?? ""} />
      </section>
    </AppShell>
  );
}
