import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ملف إنشاء حسابات جاهزة (أدمن + موظف بيع)
// شغّله: npx prisma db seed
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@academy.local" },
    update: {},
    create: {
      name: "مشرف المنصة",
      email: "admin@academy.local",
      phone: "01110000001",
      passwordHash,
      role: "ADMIN",
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@academy.local" },
    update: {},
    create: {
      name: "موظف منفذ البيع",
      email: "cashier@academy.local",
      phone: "01110000002",
      passwordHash,
      role: "CASHIER",
    },
  });

  // حساب اختبار: مدرس
  const teacher = await prisma.user.upsert({
    where: { email: "teacher1@test.com" },
    update: { passwordHash, active: true, role: "TEACHER" },
    create: {
      name: "أستاذ محمود",
      email: "teacher1@test.com",
      phone: "01112345678",
      passwordHash,
      role: "TEACHER",
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      subject: "رياضيات",
      bio: "مدرس رياضيات لجميع المراحل — شرح مبسط وتدريبات مستمرة.",
      defaultHourlyRate: 100,
      defaultPlatformPercent: 30,
      defaultFixedFee: 10,
    },
  });

  // حساب اختبار: طالب
  const student = await prisma.user.upsert({
    where: { email: "student1@test.com" },
    update: {},
    create: {
      name: "الطالب محمد",
      email: "student1@test.com",
      phone: "01122222222",
      passwordHash,
      role: "STUDENT",
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent1@test.com" },
    update: {},
    create: {
      name: "ولي أمر تجريبي",
      email: "parent1@test.com",
      phone: "01133333333",
      passwordHash,
      role: "PARENT",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff1@test.com" },
    update: {},
    create: {
      name: "أخصائية سارة",
      email: "staff1@test.com",
      phone: "01144444444",
      passwordHash,
      role: "STAFF",
    },
  });
  await prisma.staffProfile.upsert({
    where: { userId: staff.id },
    update: {},
    create: { userId: staff.id, specialization: "أنشطة وتقييم مهارات", bio: "متابعة نمو الأطفال والأنشطة." },
  });

  const stages = [
    { name: "استقبال", ageMin: 2, ageMax: 3, description: "تأسيس اللغة والحركة والتفاعل." },
    { name: "KG 1", ageMin: 3, ageMax: 4, description: "تأسيس مبكر وإنجليزي ويوسي ماث." },
    { name: "KG 2", ageMin: 4, ageMax: 6, description: "استعداد المدرسة ومهارات القراءة والحساب." },
    { name: "ابتدائي", ageMin: 6, ageMax: 12, description: "المنهج الرسمي مع إنجليزي ويوسي ماث ومهارات." },
    { name: "إعدادي", ageMin: 12, ageMax: 14, description: "تثبيت الأساس والاستعداد للنظام العادي." },
  ];
  for (const stageData of stages) {
    const stage = await prisma.academyStage.findFirst({ where: { name: stageData.name } });
    if (!stage) {
      await prisma.academyStage.create({ data: { ...stageData, programs: { create: { title: `البرنامج المتكامل — ${stageData.name}`, description: stageData.description, objectives: "المنهج الرسمي + English + US Math + مهارات حياة + أنشطة", subjectsJson: ["المنهج الرسمي", "English", "US Math", "مهارات", "أنشطة"] } } } });
    }
  }

  const skills = [
    ["اللغة والتواصل", "لغوي"],
    ["الرياضيات والحساب", "رياضي"],
    ["التركيز والانتباه", "معرفي"],
    ["التعاون والتفاعل", "اجتماعي"],
    ["الحركة والتآزر", "حركي"],
    ["الإبداع والفن", "فني"],
  ];
  for (const [name, category] of skills) {
    const exists = await prisma.skill.findFirst({ where: { name } });
    if (!exists) await prisma.skill.create({ data: { name, category } });
  }

  const testClass = await prisma.class.upsert({
    where: { inviteCode: "TEST01" },
    update: {},
    create: { teacherId: teacher.id, name: "رياضيات — اختبار المنصة", subject: "رياضيات", description: "فصل بيانات الاختبار", pricePerHour: 150, platformPercent: 30, fixedFee: 10, inviteCode: "TEST01" },
  });
  await prisma.enrollment.upsert({ where: { classId_studentId: { classId: testClass.id, studentId: student.id } }, update: { status: "ACTIVE", source: "PLATFORM" }, create: { classId: testClass.id, studentId: student.id, source: "PLATFORM" } });
  const schedule = await prisma.sessionSchedule.findFirst({ where: { classId: testClass.id } });
  if (!schedule) await prisma.sessionSchedule.create({ data: { classId: testClass.id, title: "حصة الاختبار", dayOfWeek: 2, startTime: "18:00", durationMinutes: 60 } });
  const homework = await prisma.homework.findFirst({ where: { classId: testClass.id, title: "واجب الاختبار الأول" } });
  const testHomework = homework ?? await prisma.homework.create({ data: { classId: testClass.id, title: "واجب الاختبار الأول", instructions: "اكتب خطوات حل المسألة التالية.", maxScore: 100, dueAt: new Date(Date.now() + 7 * 86400000) } });
  await prisma.submission.upsert({ where: { homeworkId_studentId: { homeworkId: testHomework.id, studentId: student.id } }, update: { answer: "هذا حل تجريبي للاختبار.", status: "GRADED", score: 90, feedback: "إجابة ممتازة." }, create: { homeworkId: testHomework.id, studentId: student.id, answer: "هذا حل تجريبي للاختبار.", status: "GRADED", score: 90, feedback: "إجابة ممتازة." } });
  const testChild = await prisma.child.findFirst({ where: { name: "طفل الاختبار" } }) ?? await prisma.child.create({ data: { name: "طفل الاختبار", birthDate: new Date("2020-05-15"), stage: "KG 2", schoolGrade: "KG 2", notes: "بيانات اختبار مترابطة", guardians: { create: { guardianId: parent.id, primary: true } } } });
  const firstProgram = await prisma.academyProgram.findFirst();
  if (firstProgram) { const childProgram = await prisma.childProgram.findFirst({ where: { childId: testChild.id, active: true } }); if (!childProgram) await prisma.childProgram.create({ data: { childId: testChild.id, programId: firstProgram.id, customPlan: "تقوية التركيز واللغة." } }); }
  const firstSkill = await prisma.skill.findFirst();
  if (firstSkill) { const assessment = await prisma.childAssessment.findFirst({ where: { childId: testChild.id, skillId: firstSkill.id } }); if (!assessment) await prisma.childAssessment.create({ data: { childId: testChild.id, skillId: firstSkill.id, assessorId: staff.id, score: 82, notes: "تقدم جيد." } }); }
  const attendanceDate = new Date(); attendanceDate.setHours(0, 0, 0, 0);
  await prisma.childAttendance.upsert({ where: { childId_date_mode: { childId: testChild.id, date: attendanceDate, mode: "ONSITE" } }, update: { status: "PRESENT", recordedById: staff.id }, create: { childId: testChild.id, date: attendanceDate, mode: "ONSITE", status: "PRESENT", recordedById: staff.id } });
  const activity = await prisma.activity.findFirst({ where: { title: "يوم الأنشطة التجريبي" } }) ?? await prisma.activity.create({ data: { title: "يوم الأنشطة التجريبي", type: "فنية وترفيهية", description: "فعالية بيانات الاختبار.", scheduledAt: new Date(Date.now() + 14 * 86400000), location: "مقر الأكاديمية", capacity: 20, createdById: admin.id } });
  await prisma.activityEnrollment.upsert({ where: { activityId_childId: { activityId: activity.id, childId: testChild.id } }, update: {}, create: { activityId: activity.id, childId: testChild.id } });
  const subscription = await prisma.nurserySubscription.findFirst({ where: { childId: testChild.id } }) ?? await prisma.nurserySubscription.create({ data: { childId: testChild.id, planName: "الأكاديمية المتكاملة — اختبار", monthlyAmount: 2500, discount: 250, startDate: new Date(), nextDueDate: new Date(Date.now() + 30 * 86400000) } });
  const invoice = await prisma.nurseryInvoice.findFirst({ where: { subscriptionId: subscription.id } });
  if (!invoice) await prisma.nurseryInvoice.create({ data: { invoiceNumber: "NINV-SEED-001", childId: testChild.id, subscriptionId: subscription.id, amount: 2250, dueDate: subscription.nextDueDate } });
  await prisma.payment.upsert({ where: { receiptNumber: "SEED-RECEIPT-001" }, update: {}, create: { receiptNumber: "SEED-RECEIPT-001", studentId: student.id, cashierId: cashier.id, classId: testClass.id, amount: 150, method: "CASH", status: "PAID", description: "دفعة بيانات الاختبار" } });

  // بيانات كثيرة للاختبار — كل عنصر له مفتاح ثابت حتى يمكن تشغيل seed أكثر من مرة.
  const bulkTeachers = [];
  for (let i = 2; i <= 9; i++) {
    const bulkTeacher = await prisma.user.upsert({ where: { email: `teacher${i}@test.com` }, update: { active: true, passwordHash }, create: { name: `مدرس اختبار ${i}`, email: `teacher${i}@test.com`, phone: `0116${String(1000000 + i).padStart(7, "0")}`, passwordHash, role: "TEACHER" } });
    await prisma.teacherProfile.upsert({ where: { userId: bulkTeacher.id }, update: {}, create: { userId: bulkTeacher.id, subject: i % 2 ? "لغة إنجليزية" : "رياضيات", bio: `بيانات مدرس رقم ${i} للاختبار.`, defaultHourlyRate: 100 + i * 10, defaultPlatformPercent: 25 + (i % 4) * 5, defaultFixedFee: 10 + i } });
    bulkTeachers.push(bulkTeacher);
  }
  const bulkStudents = [];
  for (let i = 2; i <= 31; i++) {
    const bulkStudent = await prisma.user.upsert({ where: { email: `student${i}@test.com` }, update: { active: true, passwordHash }, create: { name: `طالب اختبار ${i}`, email: `student${i}@test.com`, phone: `0115${String(1000000 + i).padStart(7, "0")}`, passwordHash, role: "STUDENT" } });
    bulkStudents.push(bulkStudent);
  }
  const bulkClasses = [];
  for (let i = 0; i < bulkTeachers.length; i++) {
    const teacher = bulkTeachers[i];
    const inviteCode = `BULK${String(i + 2).padStart(2, "0")}`;
    const bulkClass = await prisma.class.upsert({ where: { inviteCode }, update: {}, create: { teacherId: teacher.id, name: `فصل اختبار ${i + 2}`, subject: i % 2 ? "English" : "رياضيات", description: "فصل تجريبي ببيانات كثيرة.", pricePerHour: 120 + i * 10, platformPercent: 30, fixedFee: 10, inviteCode } });
    bulkClasses.push(bulkClass);
    for (const bulkStudent of bulkStudents.slice(i, i + 12)) await prisma.enrollment.upsert({ where: { classId_studentId: { classId: bulkClass.id, studentId: bulkStudent.id } }, update: { status: "ACTIVE" }, create: { classId: bulkClass.id, studentId: bulkStudent.id, source: bulkStudent.id.endsWith("0") ? "TEACHER" : "PLATFORM" } });
    if (!(await prisma.sessionSchedule.findFirst({ where: { classId: bulkClass.id } }))) await prisma.sessionSchedule.create({ data: { classId: bulkClass.id, title: "حصة أسبوعية", dayOfWeek: i % 7, startTime: `${String(16 + (i % 4)).padStart(2, "0")}:00`, durationMinutes: 60 } });
    for (let h = 1; h <= 3; h++) {
      const homeworkTitle = `واجب ${h} — ${bulkClass.name}`;
      const hw = await prisma.homework.findFirst({ where: { classId: bulkClass.id, title: homeworkTitle } }) ?? await prisma.homework.create({ data: { classId: bulkClass.id, title: homeworkTitle, instructions: `تعليمات الواجب رقم ${h} للفصل.`, maxScore: 100, dueAt: new Date(Date.now() + (h + 1) * 86400000) } });
      for (const bulkStudent of bulkStudents.slice(i, i + 5)) await prisma.submission.upsert({ where: { homeworkId_studentId: { homeworkId: hw.id, studentId: bulkStudent.id } }, update: {}, create: { homeworkId: hw.id, studentId: bulkStudent.id, answer: `حل تجريبي للطالب ${bulkStudent.name}`, status: h === 1 ? "GRADED" : "SUBMITTED", score: h === 1 ? 80 + (i % 20) : null, feedback: h === 1 ? "استمر في التقدم." : null } });
    }
  }
  const academyPrograms = await prisma.academyProgram.findMany({ take: 5 });
  const academySkills = await prisma.skill.findMany({ take: 6 });
  const bulkChildren = [];
  for (let i = 2; i <= 31; i++) {
    const child = await prisma.child.findFirst({ where: { name: `طفل اختبار ${i}` } }) ?? await prisma.child.create({ data: { name: `طفل اختبار ${i}`, birthDate: new Date(`${2012 + (i % 10)}-${String((i % 9) + 1).padStart(2, "0")}-15`), stage: i % 3 === 0 ? "KG 2" : i % 3 === 1 ? "ابتدائي" : "إعدادي", schoolGrade: `صف ${i % 6 + 1}`, notes: "ملاحظات اختبارية", guardians: { create: { guardianId: parent.id, primary: true } } } });
    bulkChildren.push(child);
    const program = academyPrograms[i % academyPrograms.length];
    if (program && !(await prisma.childProgram.findFirst({ where: { childId: child.id, active: true } }))) await prisma.childProgram.create({ data: { childId: child.id, programId: program.id, customPlan: `خطة مخصصة للطفل ${i}.` } });
    const skill = academySkills[i % academySkills.length];
    if (skill && !(await prisma.childAssessment.findFirst({ where: { childId: child.id, skillId: skill.id } }))) await prisma.childAssessment.create({ data: { childId: child.id, skillId: skill.id, assessorId: staff.id, score: 60 + (i % 41), notes: "تقييم تجريبي." } });
    const attendanceDate = new Date(); attendanceDate.setDate(attendanceDate.getDate() - (i % 10)); attendanceDate.setHours(0, 0, 0, 0);
    await prisma.childAttendance.upsert({ where: { childId_date_mode: { childId: child.id, date: attendanceDate, mode: i % 2 ? "ONSITE" : "ONLINE" } }, update: {}, create: { childId: child.id, date: attendanceDate, mode: i % 2 ? "ONSITE" : "ONLINE", status: i % 5 === 0 ? "LATE" : "PRESENT", recordedById: staff.id } });
    const sub = await prisma.nurserySubscription.findFirst({ where: { childId: child.id } }) ?? await prisma.nurserySubscription.create({ data: { childId: child.id, planName: "الباقة المتكاملة", monthlyAmount: 1800 + i * 25, discount: i % 4 === 0 ? 100 : 0, startDate: new Date(), nextDueDate: new Date(Date.now() + 30 * 86400000) } });
    if (!(await prisma.nurseryInvoice.findFirst({ where: { subscriptionId: sub.id } }))) await prisma.nurseryInvoice.create({ data: { invoiceNumber: `NINV-BULK-${String(i).padStart(3, "0")}`, childId: child.id, subscriptionId: sub.id, amount: sub.monthlyAmount.sub(sub.discount), dueDate: sub.nextDueDate } });
  }
  for (let i = 1; i <= 12; i++) {
    const event = await prisma.activity.findFirst({ where: { title: `فعالية اختبار ${i}` } }) ?? await prisma.activity.create({ data: { title: `فعالية اختبار ${i}`, type: i % 2 ? "فنية" : "رياضية", description: "فعالية تجريبية ببيانات كثيرة.", scheduledAt: new Date(Date.now() + (i + 1) * 86400000), location: i % 2 ? "قاعة الأنشطة" : "ملعب الأكاديمية", capacity: 20 + i, createdById: admin.id } });
    for (const child of bulkChildren.slice(0, 5)) await prisma.activityEnrollment.upsert({ where: { activityId_childId: { activityId: event.id, childId: child.id } }, update: {}, create: { activityId: event.id, childId: child.id, status: "REGISTERED" } });
  }
  for (let i = 0; i < bulkClasses.length; i++) for (const bulkStudent of bulkStudents.slice(i, i + 3)) await prisma.payment.upsert({ where: { receiptNumber: `BULK-RECEIPT-${i}-${bulkStudent.id}` }, update: {}, create: { receiptNumber: `BULK-RECEIPT-${i}-${bulkStudent.id}`, studentId: bulkStudent.id, cashierId: cashier.id, classId: bulkClasses[i].id, amount: bulkClasses[i].pricePerHour, method: i % 2 ? "MOBILE_WALLET" : "CASH", status: "PAID", description: "دفعة اختبارية كثيرة" } });
  for (let i = 0; i < bulkClasses.length; i++) {
    const egressId = `seed-egress-${i + 1}`;
    await prisma.recording.upsert({ where: { egressId }, update: {}, create: { egressId, classId: bulkClasses[i].id, title: `تسجيل اختبار ${i + 1}`, status: "STOPPED", durationSeconds: 1800 + i * 120, filePath: null, startedAt: new Date(Date.now() - (i + 1) * 86400000), endedAt: new Date(Date.now() - (i + 1) * 86400000 + 1800000) } });
  }

  console.log("تم إنشاء الحسابات التالية:");
  console.log("أدمن   :", admin.email, "/ Admin@123456");
  console.log("موظف   :", cashier.email, "/ Admin@123456");
  console.log("مدرس   :", teacher.email, "/ Admin@123456");
  console.log("طالب   :", student.email, "/ Admin@123456");
  console.log("ولي أمر:", parent.email, "/ Admin@123456");
  console.log("أخصائية:", staff.email, "/ Admin@123456");
  console.log("كود فصل الاختبار: TEST01");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
