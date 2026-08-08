import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getChildSubjects, getChildLessons, getChildTimetable, getChildPendingHomework, isMyChild } from "@/lib/education";
import { SubjectForm, LessonForm, ScheduleEntryForm, HomeworkForm } from "@/components/education/education-forms";
import { deleteSubject, deleteLesson, deleteScheduleEntry, markHomeworkDone } from "@/app/actions/education";

const DAYS = ["الجمعة", "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const TYPE_LABELS: Record<string, string> = { SCHOOL: "مدرسي", ENGLISH: "إنجليزي", SOFT_SKILLS: "سوفت سكيلز", COMPUTER: "كمبيوتر", PROGRAMMING: "برمجة" };

export default async function ChildEducationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: childId } = await params;
  const user = await requireUser();
  if (user.role !== "PARENT" && user.role !== "ADMIN" && user.role !== "STAFF") redirect("/dashboard");

  if (!(await isMyChild(childId)) && user.role !== "ADMIN" && user.role !== "STAFF") {
    redirect("/family/education");
  }

  const [subjects, lessons, timetable, pendingHomework] = await Promise.all([
    getChildSubjects(childId),
    getChildLessons(childId, 20),
    getChildTimetable(childId),
    getChildPendingHomework(childId),
  ]);

  // sort timetable by day
  const sortedTimetable = [...timetable].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  const subjectOptions = subjects.map((s) => ({ id: s.id, name: s.name, teacher: s.teacher }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">التعليم المنزلي</h1>
        </div>
        <Link href="/family/education" className="text-sm text-blue-600 hover:text-blue-800">كل الأطفال</Link>
      </div>

      {/* ======= المواد ======= */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">المواد الدراسية</h2>
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.length === 0 ? (
            <p className="text-sm text-slate-400">لا توجد مواد مضافة بعد</p>
          ) : (
            subjects.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-800">{s.name}</h3>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{TYPE_LABELS[s.type] || s.type}</span>
                    {s.bookTitle && <p className="mt-1 text-xs text-slate-500">كتاب: {s.bookTitle}</p>}
                    {s.teacher && <p className="text-xs text-slate-500">مدرس: {s.teacher}</p>}
                  </div>
                  <form action={deleteSubject.bind(null)}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="childId" value={childId} />
                    <button className="text-xs text-red-500 hover:text-red-700">حذف</button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">+ إضافة مادة جديدة</summary>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4">
            <SubjectForm childId={childId} />
          </div>
        </details>
      </section>

      {/* ======= آخر الحصص + إضافة حصة ======= */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">سجل الحصص</h2>
        <details className="group mb-6">
          <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">+ تسجيل حصة جديدة</summary>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4">
            <LessonForm childId={childId} subjects={subjectOptions} />
          </div>
        </details>

        {lessons.length === 0 ? (
          <p className="text-sm text-slate-400">لا توجد حصص مسجلة بعد</p>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">{lesson.subject.name}</span>
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{TYPE_LABELS[lesson.subject.type]}</span>
                      {lesson.teacher && <span className="text-xs text-slate-500">المدرس: {lesson.teacher}</span>}
                    </div>
                    <p className="text-xs text-slate-400">{new Date(lesson.date).toLocaleDateString("ar-EG")} {lesson.startTime || ""}{lesson.duration ? ` (${lesson.duration} د)` : ""}</p>
                    <div className="mt-2 rounded bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{lesson.content}</div>
                    {lesson.notes && <p className="mt-1 text-xs text-slate-400">ملاحظات: {lesson.notes}</p>}

                    {/* الواجبات المرتبطة بالحصة */}
                    {lesson.homework.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {lesson.homework.map((hw) => (
                          <div key={hw.id} className="flex items-center gap-3 rounded bg-amber-50 p-2 text-sm">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${hw.status === "DONE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                              {hw.status === "DONE" ? "تم" : "معلق"}
                            </span>
                            <span className="flex-1">{hw.description}</span>
                            {hw.dueDate && <span className="text-xs text-slate-400">آخر موعد: {new Date(hw.dueDate).toLocaleDateString("ar-EG")}</span>}
                            {hw.status !== "DONE" && (
                              <form action={markHomeworkDone.bind(null)} className="inline">
                                <input type="hidden" name="id" value={hw.id} />
                                <input type="hidden" name="childId" value={childId} />
                                <button className="text-xs text-green-600 hover:text-green-800">تم الإنجاز</button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* إضافة واجب للحصة */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-blue-500 hover:text-blue-700">+ إضافة واجب</summary>
                      <HomeworkForm lessonId={lesson.id} childId={childId} />
                    </details>
                  </div>
                  <form action={deleteLesson.bind(null)} className="mr-3">
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="childId" value={childId} />
                    <button className="text-xs text-red-400 hover:text-red-600">X</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======= الجدول الأسبوعي ======= */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">الجدول الأسبوعي</h2>
        <details className="group mb-4">
          <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">+ إضافة للجدول</summary>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4">
            <ScheduleEntryForm childId={childId} subjects={subjectOptions.map(s => ({ id: s.id, name: s.name }))} />
          </div>
        </details>

        {sortedTimetable.length === 0 ? (
          <p className="text-sm text-slate-400">لا توجد بنود في الجدول بعد</p>
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
                      <div key={entry.id} className="flex items-center justify-between rounded bg-slate-50 p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">{entry.startTime}{entry.endTime ? ` - ${entry.endTime}` : ""}</span>
                          <span>{entry.label}</span>
                          {entry.subject && <span className="text-xs text-blue-600">({entry.subject.name})</span>}
                        </div>
                        <form action={deleteScheduleEntry.bind(null)} className="inline">
                          <input type="hidden" name="id" value={entry.id} />
                          <input type="hidden" name="childId" value={childId} />
                          <button className="text-xs text-red-400 hover:text-red-600">X</button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ======= واجبات معلقة ======= */}
      {pendingHomework.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-amber-800">واجبات معلقة</h2>
          <div className="space-y-2">
            {pendingHomework.map((hw) => (
              <div key={hw.id} className="flex items-center gap-3 rounded bg-white p-3 text-sm">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">معلق</span>
                <span className="flex-1">{hw.description}</span>
                <span className="text-xs text-slate-400">{hw.lesson.subject?.name}</span>
                {hw.dueDate && <span className="text-xs text-red-400">آخر موعد: {new Date(hw.dueDate).toLocaleDateString("ar-EG")}</span>}
                <form action={markHomeworkDone.bind(null)} className="inline">
                  <input type="hidden" name="id" value={hw.id} />
                  <input type="hidden" name="childId" value={childId} />
                  <button className="rounded bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600">تم</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
