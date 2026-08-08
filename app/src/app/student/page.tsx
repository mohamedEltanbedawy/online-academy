import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyChild, getChildSubjects, getChildLessons, getChildTimetable, getChildPendingHomework } from "@/lib/education";
import { markHomeworkDone } from "@/app/actions/education";

const DAYS = ["الجمعة", "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const TYPE_LABELS: Record<string, string> = { SCHOOL: "مدرسي", ENGLISH: "إنجليزي", SOFT_SKILLS: "سوفت سكيلز", COMPUTER: "كمبيوتر", PROGRAMMING: "برمجة" };

export default async function StudentPage() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect("/dashboard");

  const child = await getMyChild();
  if (!child) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800">مرحبًا {user.name}</h1>
        <p className="text-slate-500">لم يتم ربط حسابك بطفل بعد. تواصل مع ولي أمرك.</p>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800">العودة للوحة الرئيسية</Link>
      </div>
    );
  }

  const childId = child.id;
  const [subjects, lessons, timetable, pendingHomework] = await Promise.all([
    getChildSubjects(childId),
    getChildLessons(childId, 20),
    getChildTimetable(childId),
    getChildPendingHomework(childId),
  ]);

  const sortedTimetable = [...timetable].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">مرحبًا {child.name}</h1>
        <span className="text-sm text-slate-500">{child.schoolGrade || child.stage || ""}</span>
      </div>

      {/* ======= جدولي الأسبوعي ======= */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">جدولي الأسبوعي</h2>
        {sortedTimetable.length === 0 ? (
          <p className="text-sm text-slate-400">لا يوجد جدول مضاف بعد. سيضيفه ولي الأمر قريبًا.</p>
        ) : (
          <div className="space-y-2">
            {DAYS.map((dayName, dayIndex) => {
              const entries = sortedTimetable.filter((e) => e.dayOfWeek === dayIndex);
              if (entries.length === 0) return null;
              return (
                <div key={dayIndex} className="rounded-lg border border-slate-200 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-600">{dayName}</h3>
                  <div className="space-y-1">
                    {entries.map((entry) => (
                      <div key={entry.id} className="rounded bg-slate-50 p-2 text-sm">
                        <span className="font-mono text-xs text-slate-500">{entry.startTime}{entry.endTime ? ` - ${entry.endTime}` : ""}</span>
                        {" "}{entry.label}
                        {entry.subject && <span className="mr-2 text-xs text-blue-600">({entry.subject.name})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ======= مواد الدراسية ======= */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">موادي الدراسية</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.length === 0 ? (
            <p className="text-sm text-slate-400">لا توجد مواد مضافة بعد</p>
          ) : (
            subjects.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h3 className="font-medium text-slate-800">{s.name}</h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{TYPE_LABELS[s.type] || s.type}</span>
                {s.bookTitle && <p className="mt-1 text-xs text-slate-500">كتاب: {s.bookTitle}</p>}
                {s.teacher && <p className="text-xs text-slate-500">مدرس: {s.teacher}</p>}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ======= واجباتي ======= */}
      {pendingHomework.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-amber-800">واجباتي المعلقة</h2>
          <div className="space-y-2">
            {pendingHomework.map((hw) => (
              <div key={hw.id} className="flex items-center gap-3 rounded bg-white p-3 text-sm">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">يجب إنجازه</span>
                <span className="flex-1">{hw.description}</span>
                <span className="text-xs text-slate-400">{hw.lesson.subject?.name}</span>
                {hw.dueDate && <span className="text-xs text-red-400">آخر موعد: {new Date(hw.dueDate).toLocaleDateString("ar-EG")}</span>}
                <form action={markHomeworkDone.bind(null)} className="inline">
                  <input type="hidden" name="id" value={hw.id} />
                  <input type="hidden" name="childId" value={childId} />
                  <button className="rounded bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600">تم الإنجاز</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======= آخر الحصص ======= */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">آخر الحصص</h2>
        {lessons.slice(0, 10).length === 0 ? (
          <p className="text-sm text-slate-400">لا توجد حصص مسجلة بعد</p>
        ) : (
          <div className="space-y-3">
            {lessons.slice(0, 10).map((lesson) => (
              <div key={lesson.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-800">{lesson.subject.name}</span>
                  <span className="text-xs text-slate-400">{new Date(lesson.date).toLocaleDateString("ar-EG")}</span>
                  {lesson.teacher && <span className="text-xs text-slate-500">- {lesson.teacher}</span>}
                </div>
                <div className="mt-2 rounded bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{lesson.content}</div>
                {lesson.homework.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {lesson.homework.map((hw) => (
                      <div key={hw.id} className="flex items-center gap-2 text-sm">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${hw.status === "DONE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {hw.status === "DONE" ? "تم التسليم" : "معلق"}
                        </span>
                        <span>{hw.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
