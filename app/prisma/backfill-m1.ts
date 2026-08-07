import { PrismaClient, TenantType, RelationshipType } from "@prisma/client";

// backfill بلوك M1: تحويل النظام الحالي إلى Family OS
// - ينشئ مستأجر "أكاديمية القرية" واحد (INSTITUTION)
// - كل مستخدم وكل طفل يصبح Person (توأم رقمي)
// - يبني عائلات مؤقتة من روابط ChildGuardian + علاقات GUARDIAN_OF
// - يعبّئ tenantId على جداول التشغيل
// آمن لإعادة التشغيل (idempotent) — شغّله: npx tsx prisma/backfill-m1.ts
const prisma = new PrismaClient();

async function main() {
  console.log("بدء backfill M1...");

  // 1) المستأجر الوحيد للمنصة الحالية
  const academyTenant = await prisma.tenant.upsert({
    where: { slug: "academy" },
    update: { name: "أكاديمية القرية", type: "INSTITUTION", locale: "ar", active: true },
    create: {
      slug: "academy",
      name: "أكاديمية القرية",
      type: TenantType.INSTITUTION,
      locale: "ar",
    },
  });
  console.log("مستأجر أكاديمية القرية: جاهز");

  // 2) كل المستخدمين → Persons
  const users = await prisma.user.findMany();
  let usersLinked = 0;
  for (const u of users) {
    const existing = await prisma.person.findUnique({ where: { userId: u.id } });
    if (existing) {
      await prisma.person.update({
        where: { id: existing.id },
        data: { tenantId: academyTenant.id, fullName: u.name },
      });
      continue;
    }
    await prisma.person.create({
      data: {
        tenantId: academyTenant.id,
        fullName: u.name,
        userId: u.id,
        externalKey: `user:${u.id}`,
      },
    });
    usersLinked++;
  }
  console.log(`مستخدمون تحولوا إلى Persons: ${usersLinked} (الإجمالي ${users.length})`);

  // 3) كل الأطفال → Persons (بدون حساب دخول)
  const children = await prisma.child.findMany();
  let childrenLinked = 0;
  for (const c of children) {
    const key = `child:${c.id}`;
    const existing = await prisma.person.findUnique({ where: { externalKey: key } });
    if (existing) {
      await prisma.person.update({
        where: { id: existing.id },
        data: { tenantId: academyTenant.id, fullName: c.name, birthDate: c.birthDate },
      });
      continue;
    }
    await prisma.person.create({
      data: {
        tenantId: academyTenant.id,
        fullName: c.name,
        birthDate: c.birthDate,
        externalKey: key,
      },
    });
    childrenLinked++;
  }
  console.log(`أطفال تحولوا إلى Persons: ${childrenLinked} (الإجمالي ${children.length})`);

  // 4) عائلات مؤقتة + علاقات ولي الأمر
  const guardianLinks = await prisma.childGuardian.findMany();
  const familyIndex = new Map<string, string>(); // مفتاح "guardianIds" → familyId
  let familiesCreated = 0;
  let relationshipsCreated = 0;

  const personByKey = new Map<string, string>(); // externalKey → personId
  const guardianUserToPerson = new Map<string, string>(); // userId → personId

  for (const link of guardianLinks) {
    let guardianPerson = guardianUserToPerson.get(link.guardianId);
    if (!guardianPerson) {
      const p = await prisma.person.findUnique({ where: { userId: link.guardianId } });
      if (p) {
        guardianPerson = p.id;
        guardianUserToPerson.set(link.guardianId, p.id);
      }
    }
    const childKey = `child:${link.childId}`;
    if (!guardianPerson || personByKey.has(childKey)) continue;

    const childPerson = personByKey.get(childKey) ?? (await prisma.person.findUnique({ where: { externalKey: childKey } }))?.id;
    if (!childPerson) continue;
    personByKey.set(childKey, childPerson);

    // عائلة واحدة لكل مجموعة أوصياء (مبسّط: عائلة لكل ولي أساسي)
    const familyKey = guardianPerson;
    let familyId = familyIndex.get(familyKey);
    if (!familyId) {
      const existingFamily = await prisma.family.findFirst({ where: { headPersonId: guardianPerson } });
      if (existingFamily) {
        familyId = existingFamily.id;
      } else {
        const g = await prisma.user.findUnique({ where: { id: link.guardianId } });
        const family = await prisma.family.create({
          data: {
            tenantId: academyTenant.id,
            name: `عائلة ${g?.name ?? "ولي الأمر"}`,
            headPersonId: guardianPerson,
          },
        });
        familyId = family.id;
        familiesCreated++;
      }
      familyIndex.set(familyKey, familyId);
      await prisma.familyMember.upsert({
        where: { familyId_personId: { familyId, personId: guardianPerson } },
        update: { isPrimary: true },
        create: { familyId, personId: guardianPerson, role: "ولي أمر", isPrimary: true },
      });
    }

    await prisma.familyMember.upsert({
      where: { familyId_personId: { familyId, personId: childPerson } },
      update: {},
      create: { familyId, personId: childPerson, role: "طفل" },
    });

    // علاقة ولي الأمر ← الطفل
    const rel = await prisma.relationship.findFirst({
      where: { fromPersonId: guardianPerson, toPersonId: childPerson, type: RelationshipType.GUARDIAN_OF },
    });
    if (!rel) {
      await prisma.relationship.create({
        data: {
          tenantId: academyTenant.id,
          fromPersonId: guardianPerson,
          toPersonId: childPerson,
          type: RelationshipType.GUARDIAN_OF,
        },
      });
      relationshipsCreated++;
    }
  }
  console.log(`عائلات مؤقتة: ${familiesCreated} — علاقات ولي أمر: ${relationshipsCreated}`);

  // 5) تعبئة tenantId على جداول التشغيل
  const tenantTables: Array<{ label: string; update: () => Promise<{ count: number }> }> = [
    { label: "Child", update: () => prisma.child.updateMany({ where: { tenantId: null }, data: { tenantId: academyTenant.id } }) },
    { label: "Class", update: () => prisma.class.updateMany({ where: { tenantId: null }, data: { tenantId: academyTenant.id } }) },
    { label: "Activity", update: () => prisma.activity.updateMany({ where: { tenantId: null }, data: { tenantId: academyTenant.id } }) },
    { label: "AcademyProgram", update: () => prisma.academyProgram.updateMany({ where: { tenantId: null }, data: { tenantId: academyTenant.id } }) },
    { label: "AcademyStage", update: () => prisma.academyStage.updateMany({ where: { tenantId: null }, data: { tenantId: academyTenant.id } }) },
    { label: "Skill", update: () => prisma.skill.updateMany({ where: { tenantId: null }, data: { tenantId: academyTenant.id } }) },
    { label: "NurserySubscription", update: () => prisma.nurserySubscription.updateMany({ where: { tenantId: null }, data: { tenantId: academyTenant.id } }) },
    { label: "Payment", update: () => prisma.payment.updateMany({ where: { tenantId: null }, data: { tenantId: academyTenant.id } }) },
  ];
  for (const t of tenantTables) {
    const result = await t.update();
    console.log(`tbl ${t.label}: تم تعبئة ${result.count} صف`);
  }

  // 6) سجل تدقيق (AuditLog)
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "BACKFILL_M1",
        entity: "System",
        entityId: academyTenant.id,
        details: { description: "تحويل المنصة إلى Family OS: مستأجر واحد + Persons + عائلات + tenantId" },
      },
    });
  }

  console.log("اكتمل backfill M1 بنجاح ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
