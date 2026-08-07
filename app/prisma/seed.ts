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
  for (let i = 7; i <= 20; i++) {
    const name = `مهارة عربية تجريبية ${i}`;
    if (!(await prisma.skill.findFirst({ where: { name } }))) await prisma.skill.create({ data: { name, category: i % 2 ? "لغوي" : "معرفي", description: "مهارة إضافية لبيانات العرض." } });
  }
  for (let i = 6; i <= 20; i++) {
    const name = `مرحلة تجريبية ${i}`;
    const stage = await prisma.academyStage.findFirst({ where: { name } }) ?? await prisma.academyStage.create({ data: { name, ageMin: 2 + i % 10, ageMax: 4 + i % 12, description: "مرحلة تعليمية عربية تجريبية." } });
    if (!(await prisma.academyProgram.findFirst({ where: { title: `برنامج عربي تجريبي ${i}` } }))) await prisma.academyProgram.create({ data: { stageId: stage.id, title: `برنامج عربي تجريبي ${i}`, description: "برنامج متكامل للعرض والتجربة.", objectives: "اللغة والحساب والمهارات الحياتية", subjectsJson: ["اللغة العربية", "الرياضيات", "الفنون"] } });
  }
  for (let i = 2; i <= 21; i++) {
    const staffUser = await prisma.user.upsert({ where: { email: `staff${i}@test.com` }, update: { active: true, passwordHash, role: "STAFF" }, create: { name: `أخصائي عربي ${i}`, email: `staff${i}@test.com`, phone: `0117${String(1000000 + i).padStart(7, "0")}`, passwordHash, role: "STAFF" } });
    await prisma.staffProfile.upsert({ where: { userId: staffUser.id }, update: {}, create: { userId: staffUser.id, specialization: i % 2 ? "إرشاد أسري" : "أنشطة تعليمية", bio: `ملف أخصائي عربي تجريبي رقم ${i}.` } });
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

  // ===== Family OS: أحداث العائلة والخطة اليومية (بيانات تجريبية) =====
  const tenant = await prisma.tenant.findUnique({ where: { slug: "academy" } });
  const parentPerson = await prisma.person.findUnique({ where: { userId: parent.id } });
  const testChildPerson = await prisma.person.findUnique({ where: { externalKey: `child:${testChild.id}` } });
  if (tenant) {
    const family = await prisma.family.findFirst({ where: { tenantId: tenant.id, headPersonId: parentPerson?.id } }) ?? await prisma.family.findFirst({ where: { tenantId: tenant.id } }) ?? await prisma.family.create({ data: { tenantId: tenant.id, name: "عائلة الاختبار", headPersonId: parentPerson?.id ?? null } });
    const familyEvents = [
      { title: "مقابلة أولياء الأمور", type: "APPOINTMENT" as const, startsAt: new Date(Date.now() + 3 * 86400000), endsAt: new Date(Date.now() + 3 * 86400000 + 3600000), location: "مقر الأكاديمية", notes: "مناقشة تقدم الطفل." },
      { title: "حصة السباحة", type: "ACTIVITY" as const, startsAt: new Date(Date.now() + 5 * 86400000), endsAt: new Date(Date.now() + 5 * 86400000 + 7200000), location: "نادي المدرسة" },
    ];
    for (const ev of familyEvents) {
      const exists = await prisma.familyEvent.findFirst({ where: { tenantId: tenant.id, title: ev.title } });
      if (!exists) await prisma.familyEvent.create({ data: { tenantId: tenant.id, familyId: family.id, ...ev, createdById: parentPerson?.id ?? null } });
    }
    const planSeed = [
      { title: "مراجعة جدول الضرب", type: "TASK" as const, time: "17:00", assignedToId: testChildPerson?.id ?? null },
      { title: "تقرير متابعة الأخصائية", type: "REMINDER" as const, time: "19:00", assignedToId: parentPerson?.id ?? null },
      { title: "أنشطة إبداعية", type: "ACTIVITY" as const, time: "16:00", assignedToId: null },
    ];
    for (const item of planSeed) {
      const exists = await prisma.planItem.findFirst({ where: { tenantId: tenant.id, title: item.title } });
      if (!exists) await prisma.planItem.create({ data: { tenantId: tenant.id, familyId: family.id, day: new Date(), ...item } });
    }
  }

  // بيانات كثيرة للاختبار — كل عنصر له مفتاح ثابت حتى يمكن تشغيل seed أكثر من مرة.
  const bulkTeachers = [];
  for (let i = 2; i <= 21; i++) {
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
  for (let i = 1; i <= 20; i++) {
    const event = await prisma.activity.findFirst({ where: { title: `فعالية اختبار ${i}` } }) ?? await prisma.activity.create({ data: { title: `فعالية اختبار ${i}`, type: i % 2 ? "فنية" : "رياضية", description: "فعالية تجريبية ببيانات كثيرة.", scheduledAt: new Date(Date.now() + (i + 1) * 86400000), location: i % 2 ? "قاعة الأنشطة" : "ملعب الأكاديمية", capacity: 20 + i, createdById: admin.id } });
    for (const child of bulkChildren.slice(0, 5)) await prisma.activityEnrollment.upsert({ where: { activityId_childId: { activityId: event.id, childId: child.id } }, update: {}, create: { activityId: event.id, childId: child.id, status: "REGISTERED" } });
  }
  for (let i = 0; i < bulkClasses.length; i++) for (const bulkStudent of bulkStudents.slice(i, i + 3)) await prisma.payment.upsert({ where: { receiptNumber: `BULK-RECEIPT-${i}-${bulkStudent.id}` }, update: {}, create: { receiptNumber: `BULK-RECEIPT-${i}-${bulkStudent.id}`, studentId: bulkStudent.id, cashierId: cashier.id, classId: bulkClasses[i].id, amount: bulkClasses[i].pricePerHour, method: i % 2 ? "MOBILE_WALLET" : "CASH", status: "PAID", description: "دفعة اختبارية كثيرة" } });
  for (let i = 0; i < bulkClasses.length; i++) {
    const egressId = `seed-egress-${i + 1}`;
    await prisma.recording.upsert({ where: { egressId }, update: {}, create: { egressId, classId: bulkClasses[i].id, title: `تسجيل اختبار ${i + 1}`, status: "STOPPED", durationSeconds: 1800 + i * 120, filePath: null, startedAt: new Date(Date.now() - (i + 1) * 86400000), endedAt: new Date(Date.now() - (i + 1) * 86400000 + 1800000) } });
  }

  // ===== بيانات عربية موسعة للصحة والأسرة والسجلات =====
  const healthTenant = await prisma.tenant.findUnique({ where: { slug: "academy" } });
  const demoChildren = [testChild, ...bulkChildren].slice(0, 20);
  const healthNames = ["فحص دوري", "متابعة الطبيب", "زيارة العيادة", "قياس شهري", "مراجعة النمو"];
  const vaccines = ["شلل الأطفال", "الثلاثي البكتيري", "الحصبة", "الالتهاب الكبدي", "الدرن"];
  const foods = ["بيض وخبز ولبن", "أرز وفراخ وخضار", "شوربة عدس وسلطة", "مكرونة ولحم", "زبادي وفاكهة"];
  for (let i = 0; i < demoChildren.length; i++) {
    const child = demoChildren[i];
    const date = new Date();
    date.setDate(date.getDate() - i - 1);
    date.setHours(0, 0, 0, 0);
    const tenantId = healthTenant?.id ?? child.tenantId ?? null;
    if (!(await prisma.growthRecord.findFirst({ where: { childId: child.id, date } }))) {
      await prisma.growthRecord.create({ data: { childId: child.id, tenantId, date, weightKg: 12 + i * 0.35, heightCm: 88 + i * 1.2, headCm: 46 + i * 0.15, notes: `${healthNames[i % healthNames.length]} باللغة العربية.` } });
    }
    if (!(await prisma.vaccination.findFirst({ where: { childId: child.id, name: vaccines[i % vaccines.length], date } }))) {
      await prisma.vaccination.create({ data: { childId: child.id, tenantId, name: vaccines[i % vaccines.length], dose: `الجرعة ${i % 3 + 1}`, date, nextDueDate: new Date(date.getTime() + 180 * 86400000), notes: "تم التسجيل من ملف المتابعة." } });
    }
    if (!(await prisma.sleepRecord.findFirst({ where: { childId: child.id, date } }))) {
      await prisma.sleepRecord.create({ data: { childId: child.id, tenantId, date, hours: 7.5 + (i % 4) * 0.5, quality: i % 3 === 0 ? "جيدة" : i % 3 === 1 ? "متوسطة" : "ممتازة", notes: "روتين نوم عربي مستقر." } });
    }
    if (!(await prisma.nutritionRecord.findFirst({ where: { childId: child.id, date } }))) {
      await prisma.nutritionRecord.create({ data: { childId: child.id, tenantId, date, meal: i % 2 ? "الغداء" : "الفطار", foods: foods[i % foods.length], notes: "وجبة متوازنة ومناسبة للعمر." } });
    }
    const medicineName = `فيتامين ${i + 1}`;
    if (!(await prisma.medicine.findFirst({ where: { childId: child.id, name: medicineName } }))) {
      await prisma.medicine.create({ data: { childId: child.id, tenantId, name: medicineName, dosage: `${5 + i % 4} مل`, frequency: i % 2 ? "مرة يوميًا" : "كل ٨ ساعات", startDate: date, endDate: new Date(date.getTime() + 14 * 86400000), active: i % 4 !== 0, notes: "بيان تجريبي، لا يستخدم كوصفة طبية." } });
    }
    const fileName = `تقرير-صحي-${i + 1}.txt`;
    if (!(await prisma.healthDocument.findFirst({ where: { childId: child.id, fileName } }))) {
      await prisma.healthDocument.create({ data: { childId: child.id, tenantId, title: `تقرير صحي للطفل ${i + 1}`, category: i % 2 ? "تقرير" : "متابعة", fileName, mimeType: "text/plain", sizeBytes: 128, storagePath: `uploads/health/${child.id}/demo-${i + 1}.txt`, uploadedById: admin.id } });
    }
  }

  if (healthTenant) {
    const healthHead = await prisma.person.findUnique({ where: { userId: parent.id } });
    const family = await prisma.family.findFirst({ where: { tenantId: healthTenant.id, name: "عائلة الأكاديمية التجريبية" } }) ?? await prisma.family.create({ data: { tenantId: healthTenant.id, name: "عائلة الأكاديمية التجريبية", headPersonId: healthHead?.id ?? null } });
    const demoPersons = [];
    for (let i = 1; i <= 20; i++) {
      const person = await prisma.person.upsert({ where: { externalKey: `demo-person:${i}` }, update: {}, create: { tenantId: healthTenant.id, fullName: `شخص عربي تجريبي ${i}`, birthDate: new Date(`${1990 + (i % 20)}-0${i % 9 + 1}-10`), gender: i % 2 ? "أنثى" : "ذكر", externalKey: `demo-person:${i}` } });
      demoPersons.push(person);
      await prisma.familyMember.upsert({ where: { familyId_personId: { familyId: family.id, personId: person.id } }, update: { role: i < 3 ? "ولي أمر" : "فرد" }, create: { familyId: family.id, personId: person.id, role: i < 3 ? "ولي أمر" : "فرد", isPrimary: i === 1 } });
    }
    for (let i = 0; i < 20; i++) {
      const eventTitle = `موعد الأسرة العربي ${i + 1}`;
      if (!(await prisma.familyEvent.findFirst({ where: { tenantId: healthTenant.id, title: eventTitle } }))) {
        const startsAt = new Date(Date.now() + (i + 1) * 86400000);
        await prisma.familyEvent.create({ data: { tenantId: healthTenant.id, familyId: family.id, title: eventTitle, type: i % 3 === 0 ? "APPOINTMENT" : i % 3 === 1 ? "ACTIVITY" : "CUSTOM", startsAt, endsAt: new Date(startsAt.getTime() + 3600000), location: i % 2 ? "قاعة الأنشطة" : "المنزل", notes: "موعد تجريبي باللغة العربية.", createdById: demoPersons[i].id } });
      }
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() + i);
      const planTitle = `مهمة يومية عربية ${i + 1}`;
      if (!(await prisma.planItem.findFirst({ where: { tenantId: healthTenant.id, title: planTitle } }))) {
        await prisma.planItem.create({ data: { tenantId: healthTenant.id, familyId: family.id, day, title: planTitle, time: `${String(8 + i % 10).padStart(2, "0")}:00`, type: i % 2 ? "TASK" : "ACTIVITY", assignedToId: demoPersons[i].id, done: i % 4 === 0 } });
      }
    }
  }

  // جداول النظام التي تحتاج بيانات عرض أيضًا
  const demoTenants = [healthTenant].filter((value): value is NonNullable<typeof healthTenant> => Boolean(value));
  for (let i = 2; i <= 20; i++) {
    const demoTenant = await prisma.tenant.upsert({ where: { slug: `عائلة-تجريبية-${i}` }, update: {}, create: { name: `عائلة عربية تجريبية ${i}`, slug: `عائلة-تجريبية-${i}`, type: "FAMILY", locale: "ar" } });
    demoTenants.push(demoTenant);
  }
  if (healthTenant) {
    const familyPersons = await prisma.person.findMany({ where: { tenantId: healthTenant.id }, take: 20 });
    for (let i = 2; i <= 20; i++) {
      const familyName = `أسرة عربية تجريبية ${i}`;
      const family = await prisma.family.findFirst({ where: { tenantId: healthTenant.id, name: familyName } }) ?? await prisma.family.create({ data: { tenantId: healthTenant.id, name: familyName, headPersonId: familyPersons[(i - 2) % familyPersons.length]?.id ?? null } });
      const person = familyPersons[(i - 2) % familyPersons.length];
      if (person) await prisma.familyMember.upsert({ where: { familyId_personId: { familyId: family.id, personId: person.id } }, update: {}, create: { familyId: family.id, personId: person.id, role: "فرد", isPrimary: false } });
    }
    for (let i = 0; i < 20; i++) {
      const from = familyPersons[i];
      const to = familyPersons[(i + 1) % familyPersons.length];
      if (from && to && from.id !== to.id && !(await prisma.relationship.findFirst({ where: { tenantId: healthTenant.id, fromPersonId: from.id, toPersonId: to.id } }))) await prisma.relationship.create({ data: { tenantId: healthTenant.id, fromPersonId: from.id, toPersonId: to.id, type: i % 2 ? "SIBLING" : "GUARDIAN_OF", notes: "علاقة عائلية تجريبية باللغة العربية." } });
    }
  }
  for (let i = 1; i <= 20; i++) {
    const provider = i % 3 === 0 ? "OLLAMA" : i % 2 === 0 ? "OPENAI" : "GEMINI";
    const modelName = `نموذج-عربي-${i}`;
    if (!(await prisma.aiProvider.findFirst({ where: { provider, modelName } }))) await prisma.aiProvider.create({ data: { name: `مزود AI عربي ${i}`, provider, modelName, baseUrl: provider === "OLLAMA" ? "http://localhost:11434" : null, enabled: false, isDefault: false, supportsVision: provider !== "OLLAMA", temperature: 0.4, maxTokens: 1200, tenantId: i % 2 ? healthTenant?.id : null } });
  }
  for (let i = 1; i <= 20; i++) {
    const roleName = `DEMO_ROLE_${i}`;
    await prisma.accessRole.upsert({ where: { name: roleName }, update: {}, create: { name: roleName, label: `دور عربي تجريبي ${i}`, isSystem: false } });
  }
  for (let i = 1; i <= 20; i++) {
    const chat = await prisma.telegramChat.upsert({ where: { chatId: `demo-chat-${i}` }, update: { userId: parent.id, tenantId: healthTenant?.id, linkedAt: new Date() }, create: { chatId: `demo-chat-${i}`, userId: parent.id, tenantId: healthTenant?.id, linkedAt: new Date() } });
    const code = `9${String(i).padStart(5, "0")}`;
    await prisma.telegramLinkCode.upsert({ where: { code }, update: {}, create: { code, userId: parent.id, tenantId: healthTenant?.id, expiresAt: new Date(Date.now() + 7 * 86400000) } });
    void chat;
  }
  const payoutPayments = await prisma.payment.findMany({ where: { classId: { not: null } }, include: { class: { select: { teacherId: true } } }, take: 20 });
  for (const payment of payoutPayments) {
    if (payment.class?.teacherId && !(await prisma.payout.findUnique({ where: { paymentId: payment.id } }))) await prisma.payout.create({ data: { paymentId: payment.id, teacherId: payment.class.teacherId, grossAmount: payment.amount, platformFee: Number(payment.amount) * 0.3, teacherAmount: Number(payment.amount) * 0.7, status: "PAID", paidAt: new Date() } });
  }

  const auditUsers = [admin, cashier, teacher, student, parent, staff];
  for (let i = 0; i < 20; i++) {
    const action = `تسجيل نشاط عربي ${i + 1}`;
    if (!(await prisma.auditLog.findFirst({ where: { action } }))) await prisma.auditLog.create({ data: { actorId: auditUsers[i % auditUsers.length].id, action, entity: i % 2 ? "Child" : "FamilyEvent", entityId: demoChildren[i % demoChildren.length].id, details: { description: "سجل تجريبي باللغة العربية" } } });
  }

  // ===== M3: الصلاحيات (RBAC) =====
  const permissionCatalog: { code: string; label: string; module: string }[] = [
    { code: "dashboard:view", label: "مشاهدة اللوحة الرئيسية", module: "dashboard" },
    { code: "profile:view", label: "مشاهدة الملف الشخصي", module: "profile" },
    { code: "admin:view", label: "لوحة الإدارة", module: "admin" },
    { code: "admin:users:manage", label: "إدارة المستخدمين والصلاحيات", module: "admin" },
    { code: "admin:audit:view", label: "سجل النشاط الإداري", module: "admin" },
    { code: "children:view", label: "مشاهدة سجلات الأطفال", module: "children" },
    { code: "children:manage", label: "إضافة/تعديل سجلات الأطفال", module: "children" },
    { code: "classes:view", label: "مشاهدة الفصول", module: "classes" },
    { code: "classes:manage", label: "إدارة الفصول", module: "classes" },
    { code: "payments:view", label: "مشاهدة المدفوعات", module: "payments" },
    { code: "payments:manage", label: "تنفيذ وإدارة المدفوعات", module: "payments" },
    { code: "health:view", label: "مشاهدة الملف الصحي", module: "health" },
    { code: "health:manage", label: "إضافة/تعديل البيانات الصحية", module: "health" },
    { code: "health:documents", label: "رفع وإدارة الملفات الصحية", module: "health" },
    { code: "ai:view", label: "مشاهدة إعدادات الـ AI", module: "ai" },
    { code: "ai:manage", label: "إدارة موديلات الـ AI", module: "ai" },
    { code: "family:view", label: "لوحة الأسرة", module: "family" },
    { code: "family:manage", label: "إدارة بيانات الأسرة", module: "family" },
    { code: "teacher:view", label: "لوحة المدرس", module: "teacher" },
    { code: "student:view", label: "لوحة الطالب", module: "student" },
    { code: "cashier:view", label: "لوحة الموظف", module: "cashier" },
    { code: "staff:view", label: "لوحة الأخصائي", module: "staff" },
  ];
  const permissions = new Map<string, string>();
  for (const p of permissionCatalog) {
    const perm = await prisma.permission.upsert({ where: { code: p.code }, update: { label: p.label, module: p.module }, create: p });
    permissions.set(p.code, perm.id);
  }
  const roleDefinitions: { name: string; label: string; isSystem: boolean; perms: string[] }[] = [
    { name: "ADMIN", label: "مشرف عام", isSystem: true, perms: permissionCatalog.map((p) => p.code) },
    { name: "STAFF", label: "أخصائي", isSystem: true, perms: ["dashboard:view", "profile:view", "children:view", "children:manage", "health:view", "health:manage", "health:documents", "staff:view", "family:view", "ai:view"] },
    { name: "TEACHER", label: "مدرس", isSystem: true, perms: ["dashboard:view", "profile:view", "classes:view", "classes:manage", "teacher:view", "family:view"] },
    { name: "STUDENT", label: "طالب", isSystem: true, perms: ["dashboard:view", "profile:view", "student:view", "family:view"] },
    { name: "PARENT", label: "ولي أمر", isSystem: true, perms: ["dashboard:view", "profile:view", "children:view", "health:view", "family:view", "family:manage"] },
    { name: "CASHIER", label: "موظف منفذ بيع", isSystem: true, perms: ["dashboard:view", "profile:view", "payments:view", "payments:manage", "cashier:view", "family:view"] },
  ];
  for (const role of roleDefinitions) {
    const r = await prisma.accessRole.upsert({ where: { name: role.name }, update: { label: role.label }, create: { name: role.name, label: role.label, isSystem: role.isSystem } });
    for (const code of role.perms) {
      const pid = permissions.get(code);
      if (pid) await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: r.id, permissionId: pid } }, update: {}, create: { roleId: r.id, permissionId: pid } });
    }
  }
  for (const user of [admin, cashier, teacher, student, parent, staff]) {
    const roleName = ["ADMIN", "CASHIER", "TEACHER", "STUDENT", "PARENT", "STAFF"].find((r) => user.role === r);
    if (roleName) {
      const r = await prisma.accessRole.findUnique({ where: { name: roleName } });
      if (r) await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: r.id } }, update: {}, create: { userId: user.id, roleId: r.id } });
    }
  }
  // أي مستخدم موجود بدون دور → أضفه لدور افتراضي حسب الـ role
  const allUsers = await prisma.user.findMany();
  for (const u of allUsers) {
    const existing = await prisma.userRole.findFirst({ where: { userId: u.id } });
    if (!existing) {
      const r = await prisma.accessRole.findUnique({ where: { name: u.role } });
      if (r) await prisma.userRole.create({ data: { userId: u.id, roleId: r.id } });
    }
  }

  // ===== M3: موديلات الـ AI =====
  const aiModels: { name: string; provider: "GEMINI" | "OPENAI" | "OLLAMA"; modelName: string; baseUrl?: string; isDefault: boolean; enabled: boolean; supportsVision: boolean }[] = [
    { name: "Gemini Flash (افتراضي)", provider: "GEMINI", modelName: "gemini-2.5-flash", isDefault: true, enabled: true, supportsVision: true },
    { name: "Gemini Pro", provider: "GEMINI", modelName: "gemini-2.5-pro", isDefault: false, enabled: true, supportsVision: true },
    { name: "OpenAI GPT-4o-mini", provider: "OPENAI", modelName: "gpt-4o-mini", isDefault: false, enabled: false, supportsVision: true },
    { name: "Ollama محلي (llama3.1)", provider: "OLLAMA", modelName: "llama3.1", baseUrl: "http://localhost:11434", isDefault: false, enabled: false, supportsVision: false },
  ];
  for (const m of aiModels) {
    const exists = await prisma.aiProvider.findFirst({ where: { provider: m.provider, modelName: m.modelName } });
    if (!exists) await prisma.aiProvider.create({ data: { ...m, name: m.name } });
  }
  // مفتاح Gemini من البيئة لو موجود
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    await prisma.aiProvider.updateMany({ where: { provider: "GEMINI" }, data: { apiKey: geminiApiKey } });
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
