import { PrismaClient, SubjectType, ScheduleEntryType } from "@prisma/client";
import bcrypt from "bcryptjs";

// Seed: عائلة محمد فقط — لا بيانات تجريبية ولا فواتير.
// شغّله بعد `prisma migrate reset --force` أو في أي وقت (آمن إعادة التشغيل).
const prisma = new PrismaClient();

const PASSWORD = "Admin@123456";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ===== 1) المستأجر (البيئة الأساسية) =====
  const tenant = await prisma.tenant.upsert({
    where: { slug: "academy" },
    update: { name: "عائلة محمد", type: "FAMILY", locale: "ar" },
    create: { name: "عائلة محمد", slug: "academy", type: "FAMILY", locale: "ar" },
  });

  // ===== 2) حسابات العائلة =====
  const admin = await prisma.user.upsert({
    where: { email: "admin@academy.local" },
    update: { name: "محمد", role: "ADMIN", active: true, passwordHash },
    create: { name: "محمد", email: "admin@academy.local", phone: "01110000001", passwordHash, role: "ADMIN" },
  });

  const wife = await prisma.user.upsert({
    where: { email: "fatma@family.local" },
    update: { name: "فاطمه", role: "PARENT", active: true, passwordHash },
    create: { name: "فاطمه", email: "fatma@family.local", phone: "01110000002", passwordHash, role: "PARENT" },
  });

  const kids = [
    { name: "يوسف", email: "youssef@family.local", phone: "01110000003", birthDate: new Date(2018, 3, 19), grade: "الصف الثالث الابتدائي", stage: "ابتدائي" },
    { name: "تيا", email: "tia@family.local", phone: "01110000004", birthDate: new Date(2021, 3, 14), grade: "كي جي 2", stage: "KG 2" },
    { name: "يزن", email: "yazan@family.local", phone: "01110000005", birthDate: new Date(2022, 11, 1), grade: "مرحلة التأسيس", stage: "تأسيس" },
  ];

  const kidUsers = new Map<string, { id: string; name: string; role: string }>();
  for (const k of kids) {
    const u = await prisma.user.upsert({
      where: { email: k.email },
      update: { name: k.name, role: "STUDENT", active: true, passwordHash },
      create: { name: k.name, email: k.email, phone: k.phone, passwordHash, role: "STUDENT" },
    });
    kidUsers.set(k.name, { id: u.id, name: u.name, role: u.role });
  }

  // ===== 3) الأشخاص (التوأم الرقمي) =====
  const adminPerson = await prisma.person.upsert({
    where: { externalKey: `user:${admin.id}` },
    update: { fullName: "محمد", birthDate: null, gender: "ذكر", userId: admin.id },
    create: { tenantId: tenant.id, fullName: "محمد", gender: "ذكر", externalKey: `user:${admin.id}`, userId: admin.id },
  });
  const wifePerson = await prisma.person.upsert({
    where: { externalKey: `user:${wife.id}` },
    update: { fullName: "فاطمه", birthDate: null, gender: "أنثى", userId: wife.id },
    create: { tenantId: tenant.id, fullName: "فاطمه", gender: "أنثى", externalKey: `user:${wife.id}`, userId: wife.id },
  });

  const childRecords = new Map<string, { id: string; personId: string; name: string }>();
  for (const k of kids) {
    const child = await prisma.child.findFirst({ where: { name: k.name } }) ??
      await prisma.child.create({
        data: { name: k.name, birthDate: k.birthDate, stage: k.stage, schoolGrade: k.grade, tenantId: tenant.id },
      });
    const person = await prisma.person.upsert({
      where: { externalKey: `child:${child.id}` },
      update: { fullName: k.name, birthDate: k.birthDate, gender: k.name === "تيا" ? "أنثى" : "ذكر", userId: kidUsers.get(k.name)?.id },
      create: { tenantId: tenant.id, fullName: k.name, birthDate: k.birthDate, gender: k.name === "تيا" ? "أنثى" : "ذكر", externalKey: `child:${child.id}`, userId: kidUsers.get(k.name)?.id },
    });
    childRecords.set(k.name, { id: child.id, personId: person.id, name: k.name });
  }

  // ===== 4) العائلة الواحدة: عائلة المنزل =====
  const family = await prisma.family.findFirst({ where: { tenantId: tenant.id, name: "عائلة المنزل" } }) ??
    await prisma.family.create({ data: { tenantId: tenant.id, name: "عائلة المنزل", headPersonId: adminPerson.id } });

  const familyMembers: { personId: string; role: string; isPrimary: boolean }[] = [
    { personId: adminPerson.id, role: "أب", isPrimary: true },
    { personId: wifePerson.id, role: "أم", isPrimary: false },
    ...[...childRecords.values()].map((c) => ({ personId: c.personId, role: "طفل", isPrimary: false })),
  ];
  for (const m of familyMembers) {
    await prisma.familyMember.upsert({
      where: { familyId_personId: { familyId: family.id, personId: m.personId } },
      update: { role: m.role, isPrimary: m.isPrimary },
      create: { familyId: family.id, personId: m.personId, role: m.role, isPrimary: m.isPrimary },
    });
  }

  // ===== 5) العلاقات =====
  const relationships: { from: string; to: string; type: "SPOUSE" | "PARENT_OF" }[] = [];
  relationships.push({ from: adminPerson.id, to: wifePerson.id, type: "SPOUSE" });
  for (const c of childRecords.values()) {
    relationships.push({ from: adminPerson.id, to: c.personId, type: "PARENT_OF" });
    relationships.push({ from: wifePerson.id, to: c.personId, type: "PARENT_OF" });
  }
  for (const r of relationships) {
    if (!(await prisma.relationship.findFirst({ where: { tenantId: tenant.id, fromPersonId: r.from, toPersonId: r.to } }))) {
      await prisma.relationship.create({ data: { tenantId: tenant.id, fromPersonId: r.from, toPersonId: r.to, type: r.type } });
    }
  }

  // ===== 6) أولياء الأمور =====
  for (const c of childRecords.values()) {
    await prisma.childGuardian.upsert({ where: { childId_guardianId: { childId: c.id, guardianId: admin.id } }, update: { primary: true, relation: "أب" }, create: { childId: c.id, guardianId: admin.id, primary: true, relation: "أب" } });
    await prisma.childGuardian.upsert({ where: { childId_guardianId: { childId: c.id, guardianId: wife.id } }, update: { primary: false, relation: "أم" }, create: { childId: c.id, guardianId: wife.id, primary: false, relation: "أم" } });
  }

  // ===== 7) التعليم المنزلي: مواد كل طفل =====
  const subjectDefs: { childName: string; name: string; type: SubjectType; bookTitle: string; teacher: string }[] = [
    { childName: "يوسف", name: "رياضيات", type: "SCHOOL", bookTitle: "المعاصر", teacher: "أب" },
    { childName: "يوسف", name: "لغة عربية", type: "SCHOOL", bookTitle: "الأضواء", teacher: "أم" },
    { childName: "يوسف", name: "إنجليزي", type: "ENGLISH", bookTitle: "Connect Plus", teacher: "مدرس خصوصي" },
    { childName: "يوسف", name: "سوفت سكيلز", type: "SOFT_SKILLS", bookTitle: "قصص أطفال", teacher: "أم" },
    { childName: "تيا", name: "تأسيس حساب", type: "SCHOOL", bookTitle: "بكار", teacher: "أم" },
    { childName: "تيا", name: "تأسيس لغة عربية", type: "SCHOOL", bookTitle: "نور البيان", teacher: "أم" },
    { childName: "تيا", name: "إنجليزي تمهيدي", type: "ENGLISH", bookTitle: "Jolly Phonics", teacher: "أم" },
    { childName: "يزن", name: "تأسيس حساب", type: "SCHOOL", bookTitle: "بكار", teacher: "أم" },
    { childName: "يزن", name: "تأسيس لغة عربية", type: "SCHOOL", bookTitle: "نور البيان", teacher: "أم" },
    { childName: "يزن", name: "أنشطة حركية", type: "SOFT_SKILLS", bookTitle: "ألعاب تعليمية", teacher: "أب" },
  ];
  const subjectIds = new Map<string, string>(); // key: childName|subjectName
  for (const sd of subjectDefs) {
    const child = childRecords.get(sd.childName)!;
    const subj = await prisma.subject.upsert({
      where: { id: `seed-subj-${sd.childName}-${sd.name}` },
      update: { childId: child.id, tenantId: tenant.id, name: sd.name, type: sd.type, bookTitle: sd.bookTitle, teacher: sd.teacher, active: true },
      create: { id: `seed-subj-${sd.childName}-${sd.name}`, childId: child.id, tenantId: tenant.id, name: sd.name, type: sd.type, bookTitle: sd.bookTitle, teacher: sd.teacher },
    });
    subjectIds.set(`${sd.childName}|${sd.name}`, subj.id);
  }

  // ===== 8) التعليم المنزلي: حصص + واجبات =====
  const today = new Date();
  const lessonDefs: { childName: string; subjectName: string; daysAgo: number; content: string; homework: string }[] = [
    { childName: "يوسف", subjectName: "رياضيات", daysAgo: 2, content: "شرح الجمع والطرح ضمن 1000 مع حل أمثلة على السبورة.", homework: "حل تمارين 1 إلى 10 صفحة 25 في كتاب المعاصر." },
    { childName: "يوسف", subjectName: "إنجليزي", daysAgo: 1, content: "الوحدة الثانية: My Family — كلمات جديدة وجُمل بسيطة.", homework: "كتابة 5 جمل عن العائلة في الكراسة." },
    { childName: "تيا", subjectName: "تأسيس حساب", daysAgo: 2, content: "مراجعة الأرقام من 1 إلى 20 مع عدّ المكعبات.", homework: "تلوين الرقم 15 ونشاط عدّ التفاح في الكتاب." },
    { childName: "تيا", subjectName: "تأسيس لغة عربية", daysAgo: 1, content: "تعلم حرف الباء مع كلمات: باب، بيت، بطة.", homework: "نشاط حرف الباء في الكتاب (تلوين وكتابة)." },
    { childName: "يزن", subjectName: "تأسيس حساب", daysAgo: 2, content: "التعرف على الألوان والأشكال (دائرة، مربع، مثلث).", homework: "تمييز المربع عن الدائرة في ورقة العمل." },
    { childName: "يزن", subjectName: "تأسيس لغة عربية", daysAgo: 1, content: "التعرف على حرف الألف مع كلمات: أرنب، أسد.", homework: "نشاط حرف الألف — تلوين وتتبع الحرف." },
  ];
  for (const ld of lessonDefs) {
    const child = childRecords.get(ld.childName)!;
    const subjectId = subjectIds.get(`${ld.childName}|${ld.subjectName}`)!;
    const lessonDate = new Date(today);
    lessonDate.setDate(lessonDate.getDate() - ld.daysAgo);
    const lesson = await prisma.tutoringLesson.findFirst({ where: { childId: child.id, subjectId, content: ld.content } }) ??
      await prisma.tutoringLesson.create({
        data: { childId: child.id, subjectId, date: lessonDate, startTime: "10:00", duration: 60, content: ld.content, tenantId: tenant.id },
      });
    if (!(await prisma.lessonHomework.findFirst({ where: { lessonId: lesson.id, description: ld.homework } }))) {
      await prisma.lessonHomework.create({
        data: { lessonId: lesson.id, description: ld.homework, dueDate: new Date(lessonDate.getTime() + 3 * 86400000), status: "PENDING", tenantId: tenant.id },
      });
    }
  }

  // ===== 9) التعليم المنزلي: الجدول الأسبوعي =====
  const scheduleDefs: { childName: string; subjectName?: string; dayOfWeek: number; startTime: string; endTime: string; label: string; type: ScheduleEntryType }[] = [
    { childName: "يوسف", subjectName: "رياضيات", dayOfWeek: 1, startTime: "10:00", endTime: "11:00", label: "حصة رياضيات", type: "LESSON" },
    { childName: "يوسف", subjectName: "لغة عربية", dayOfWeek: 2, startTime: "10:00", endTime: "11:00", label: "حصة لغة عربية", type: "LESSON" },
    { childName: "يوسف", subjectName: "إنجليزي", dayOfWeek: 3, startTime: "10:00", endTime: "11:00", label: "حصة إنجليزي", type: "LESSON" },
    { childName: "يوسف", subjectName: "سوفت سكيلز", dayOfWeek: 4, startTime: "11:00", endTime: "12:00", label: "سوفت سكيلز", type: "LESSON" },
    { childName: "يوسف", dayOfWeek: 6, startTime: "16:00", endTime: "17:00", label: "وقت الواجبات", type: "HOMEWORK" },
    { childName: "تيا", subjectName: "تأسيس حساب", dayOfWeek: 1, startTime: "11:00", endTime: "12:00", label: "تأسيس حساب", type: "LESSON" },
    { childName: "تيا", subjectName: "تأسيس لغة عربية", dayOfWeek: 2, startTime: "11:00", endTime: "12:00", label: "تأسيس لغة عربية", type: "LESSON" },
    { childName: "تيا", subjectName: "إنجليزي تمهيدي", dayOfWeek: 3, startTime: "11:00", endTime: "12:00", label: "إنجليزي تمهيدي", type: "LESSON" },
    { childName: "تيا", dayOfWeek: 5, startTime: "12:00", endTime: "13:00", label: "لعب حر ونشاط", type: "EXERCISE" },
    { childName: "يزن", subjectName: "تأسيس حساب", dayOfWeek: 1, startTime: "12:00", endTime: "13:00", label: "تأسيس حساب", type: "LESSON" },
    { childName: "يزن", subjectName: "تأسيس لغة عربية", dayOfWeek: 2, startTime: "12:00", endTime: "13:00", label: "تأسيس لغة عربية", type: "LESSON" },
    { childName: "يزن", subjectName: "أنشطة حركية", dayOfWeek: 5, startTime: "12:00", endTime: "13:00", label: "أنشطة حركية", type: "LESSON" },
  ];
  for (const sd of scheduleDefs) {
    const child = childRecords.get(sd.childName)!;
    const subjectId = sd.subjectName ? subjectIds.get(`${sd.childName}|${sd.subjectName}`) : undefined;
    if (await prisma.weeklySchedule.findFirst({ where: { childId: child.id, dayOfWeek: sd.dayOfWeek, startTime: sd.startTime, label: sd.label } })) continue;
    await prisma.weeklySchedule.create({
      data: { childId: child.id, tenantId: tenant.id, subjectId, dayOfWeek: sd.dayOfWeek, startTime: sd.startTime, endTime: sd.endTime, label: sd.label, type: sd.type },
    });
  }

  // ===== 10) أعياد الميلاد في تقويم العائلة =====
  for (const c of childRecords.values()) {
    const k = kids.find((kk) => kk.name === c.name)!;
    const bd = new Date(today.getFullYear(), k.birthDate.getMonth(), k.birthDate.getDate());
    if (bd < today) bd.setFullYear(bd.getFullYear() + 1);
    const title = `عيد ميلاد ${c.name}`;
    if (!(await prisma.familyEvent.findFirst({ where: { tenantId: tenant.id, title } }))) {
      await prisma.familyEvent.create({
        data: { tenantId: tenant.id, familyId: family.id, title, type: "BIRTHDAY", startsAt: bd, endsAt: new Date(bd.getTime() + 2 * 3600000), notes: "يوم ميلاد سعيد! 🎉", createdById: adminPerson.id },
      });
    }
  }

  // ===== 11) خطة اليوم =====
  const planToday = new Date();
  planToday.setHours(0, 0, 0, 0);
  const planDefs: { title: string; type: "TASK" | "REMINDER"; time: string; assignToName?: string }[] = [
    { title: "مراجعة رياضيات يوسف", type: "TASK", time: "10:00", assignToName: "محمد" },
    { title: "قراءة قصة لتيا ويزن قبل النوم", type: "TASK", time: "19:30", assignToName: "فاطمه" },
    { title: "متابعة واجب إنجليزي يوسف", type: "REMINDER", time: "16:00", assignToName: "فاطمه" },
  ];
  for (const pd of planDefs) {
    if (await prisma.planItem.findFirst({ where: { tenantId: tenant.id, title: pd.title } })) continue;
    const assigned = pd.assignToName === "فاطمه" ? wifePerson.id : adminPerson.id;
    await prisma.planItem.create({
      data: { tenantId: tenant.id, familyId: family.id, day: planToday, title: pd.title, time: pd.time, type: pd.type, assignedToId: assigned },
    });
  }

  // ===== 12) مقدمات الـ AI (إعدادات النظام) =====
  if (!(await prisma.aiProvider.findFirst({ where: { provider: "GEMINI" } }))) {
    await prisma.aiProvider.create({ data: { name: "Gemini Flash", provider: "GEMINI", modelName: "gemini-2.5-flash", isDefault: true, enabled: false, supportsVision: true, temperature: 0.4, maxTokens: 1200, tenantId: tenant.id } });
  }
  if (!(await prisma.aiProvider.findFirst({ where: { provider: "OLLAMA" } }))) {
    await prisma.aiProvider.create({ data: { name: "Ollama محلي", provider: "OLLAMA", modelName: "llama3.1", baseUrl: "http://localhost:11434", isDefault: false, enabled: false, supportsVision: false, temperature: 0.4, maxTokens: 1200, tenantId: tenant.id } });
  }

  // ===== 13) الصلاحيات (RBAC) — إعدادات النظام =====
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
  for (const u of [admin, wife, ...kidUsers.values()]) {
    const roleName = ["ADMIN", "CASHIER", "TEACHER", "STUDENT", "PARENT", "STAFF"].find((r) => u.role === r);
    if (roleName) {
      const r = await prisma.accessRole.findUnique({ where: { name: roleName } });
      if (r) await prisma.userRole.upsert({ where: { userId_roleId: { userId: u.id, roleId: r.id } }, update: {}, create: { userId: u.id, roleId: r.id } });
    }
  }

  // ===== الملخص =====
  console.log("تم بناء عائلة محمد بالكامل:");
  console.log("أب   :", admin.email, "/", PASSWORD);
  console.log("أم   :", wife.email, "/", PASSWORD);
  for (const k of kids) console.log("الطفل:", k.email, "/", PASSWORD, `(${k.name})`);
  console.log("الأولاد:", kids.map((k) => k.name).join("، "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
