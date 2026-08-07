"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type AcademyActionState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function assignChildProgram(state: AcademyActionState, formData: FormData): Promise<AcademyActionState> {
  const admin = await requireRole("ADMIN");
  const childId = String(formData.get("childId") || "");
  const programId = String(formData.get("programId") || "");
  const customPlan = String(formData.get("customPlan") || "").trim();
  const child = await prisma.child.findUnique({ where: { id: childId } });
  const program = await prisma.academyProgram.findUnique({ where: { id: programId } });
  if (!child || !program) return { message: "الطفل أو البرنامج غير موجود" };
  await prisma.$transaction(async (tx) => {
    await tx.childProgram.updateMany({ where: { childId, active: true }, data: { active: false } });
    await tx.childProgram.create({ data: { childId, programId, customPlan: customPlan || null, active: true } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "ASSIGN_CHILD_PROGRAM", entity: "ChildProgram", entityId: childId, details: { programId } } });
  });
  revalidatePath(`/admin/children/${childId}`);
  redirect(`/admin/children/${childId}`);
}

export async function createChildAssessment(state: AcademyActionState, formData: FormData): Promise<AcademyActionState> {
  const assessor = await requireRole("ADMIN", "TEACHER", "STAFF");
  const childId = String(formData.get("childId") || "");
  const skillId = String(formData.get("skillId") || "");
  const score = Number(formData.get("score"));
  const notes = String(formData.get("notes") || "").trim();
  const errors: Record<string, string[]> = {};
  if (!Number.isInteger(score) || score < 0 || score > 100) errors.score = ["الدرجة من 0 إلى 100"];
  if (Object.keys(errors).length > 0) return { errors };
  const [child, skill] = await Promise.all([prisma.child.findUnique({ where: { id: childId } }), prisma.skill.findUnique({ where: { id: skillId } })]);
  if (!child || !skill) return { message: "الطفل أو المهارة غير موجودة" };
  await prisma.childAssessment.create({ data: { childId, skillId, assessorId: assessor.id, score, notes: notes || null } });
  revalidatePath(`/admin/children/${childId}`);
  redirect(assessor.role === "ADMIN" ? `/admin/children/${childId}` : `/staff/children/${childId}`);
}

export async function updateChild(state: AcademyActionState, formData: FormData): Promise<AcademyActionState> {
  const admin = await requireRole("ADMIN");
  const childId = String(formData.get("childId") || "");
  const name = String(formData.get("name") || "").trim();
  const stage = String(formData.get("stage") || "").trim();
  const schoolGrade = String(formData.get("schoolGrade") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const medicalNotes = String(formData.get("medicalNotes") || "").trim();
  if (name.length < 3) return { errors: { name: ["اكتب اسم الطفل كاملًا"] } };
  await prisma.$transaction([
    prisma.child.update({ where: { id: childId }, data: { name, stage: stage || null, schoolGrade: schoolGrade || null, notes: notes || null, medicalNotes: medicalNotes || null } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_CHILD", entity: "Child", entityId: childId } }),
  ]);
  redirect(`/admin/children/${childId}`);
}

export async function toggleChildActive(childId: string) {
  const admin = await requireRole("ADMIN");
  const child = await prisma.child.findUnique({ where: { id: childId }, select: { active: true } });
  if (!child) return;
  await prisma.$transaction([
    prisma.child.update({ where: { id: childId }, data: { active: !child.active } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: child.active ? "DEACTIVATE_CHILD" : "ACTIVATE_CHILD", entity: "Child", entityId: childId } }),
  ]);
  revalidatePath("/admin/children");
  revalidatePath(`/admin/children/${childId}`);
}

export async function updateAcademyProgram(state: AcademyActionState, formData: FormData): Promise<AcademyActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const objectives = String(formData.get("objectives") || "").trim();
  if (title.length < 3) return { errors: { title: ["اكتب اسم البرنامج"] } };
  await prisma.$transaction([
    prisma.academyProgram.update({ where: { id }, data: { title, description: description || null, objectives: objectives || null } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_ACADEMY_PROGRAM", entity: "AcademyProgram", entityId: id } }),
  ]);
  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}

export async function createAcademyStage(state: AcademyActionState, formData: FormData): Promise<AcademyActionState> {
  const admin = await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const ageMin = Number(formData.get("ageMin"));
  const ageMax = Number(formData.get("ageMax"));
  const description = String(formData.get("description") || "").trim();
  const errors: Record<string, string[]> = {};
  if (name.length < 3) errors.name = ["اكتب اسم المرحلة"];
  if (!Number.isInteger(ageMin) || ageMin < 2 || ageMin > 14) errors.ageMin = ["الحد الأدنى من 2 إلى 14"];
  if (!Number.isInteger(ageMax) || ageMax < ageMin || ageMax > 14) errors.ageMax = ["الحد الأقصى يجب أن يكون أكبر من الأصغر وحتى 14"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.$transaction([
    prisma.academyStage.create({ data: { name, ageMin, ageMax, description: description || null } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "CREATE_ACADEMY_STAGE", entity: "AcademyStage", entityId: "new", details: { name } } }),
  ]);
  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}

export async function updateAcademyStage(state: AcademyActionState, formData: FormData): Promise<AcademyActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const ageMin = Number(formData.get("ageMin"));
  const ageMax = Number(formData.get("ageMax"));
  const description = String(formData.get("description") || "").trim();
  const errors: Record<string, string[]> = {};
  if (name.length < 3) errors.name = ["اكتب اسم المرحلة"];
  if (!Number.isInteger(ageMin) || ageMin < 2 || ageMin > 14) errors.ageMin = ["الحد الأدنى من 2 إلى 14"];
  if (!Number.isInteger(ageMax) || ageMax < ageMin || ageMax > 14) errors.ageMax = ["الحد الأقصى يجب أن يكون أكبر من الأصغر وحتى 14"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.$transaction([
    prisma.academyStage.update({ where: { id }, data: { name, ageMin, ageMax, description: description || null } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "UPDATE_ACADEMY_STAGE", entity: "AcademyStage", entityId: id } }),
  ]);
  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}

export async function createAcademyProgram(state: AcademyActionState, formData: FormData): Promise<AcademyActionState> {
  const admin = await requireRole("ADMIN");
  const stageId = String(formData.get("stageId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const objectives = String(formData.get("objectives") || "").trim();
  const errors: Record<string, string[]> = {};
  if (!stageId) errors.stageId = ["اختر المرحلة"];
  if (title.length < 3) errors.title = ["اكتب اسم البرنامج"];
  if (Object.keys(errors).length > 0) return { errors };
  const stage = await prisma.academyStage.findUnique({ where: { id: stageId } });
  if (!stage) return { message: "المرحلة غير موجودة" };
  const version = (await prisma.academyProgram.count({ where: { stageId } })) + 1;
  await prisma.$transaction(async (tx) => {
    const program = await tx.academyProgram.create({ data: { stageId, title, description: description || null, objectives: objectives || null, version } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "CREATE_ACADEMY_PROGRAM", entity: "AcademyProgram", entityId: program.id, details: { title, stageId } } });
  });
  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}

export async function toggleAcademyProgramActive(programId: string) {
  const admin = await requireRole("ADMIN");
  const program = await prisma.academyProgram.findUnique({ where: { id: programId }, select: { active: true, title: true } });
  if (!program) return;
  await prisma.$transaction([
    prisma.academyProgram.update({ where: { id: programId }, data: { active: !program.active } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: program.active ? "DEACTIVATE_ACADEMY_PROGRAM" : "ACTIVATE_ACADEMY_PROGRAM", entity: "AcademyProgram", entityId: programId, details: { title: program.title } } }),
  ]);
  revalidatePath("/admin/programs");
}

export async function createSkill(state: AcademyActionState, formData: FormData): Promise<AcademyActionState> {
  const admin = await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const errors: Record<string, string[]> = {};
  if (name.length < 2) errors.name = ["اكتب اسم المهارة"];
  if (category.length < 2) errors.category = ["اكتب التصنيف (مثال: لغوي، حركي)"];
  if (Object.keys(errors).length > 0) return { errors };
  await prisma.$transaction([
    prisma.skill.create({ data: { name, category, description: description || null } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: "CREATE_SKILL", entity: "Skill", entityId: "new", details: { name, category } } }),
  ]);
  revalidatePath("/admin/skills");
  redirect("/admin/skills");
}

export async function toggleSkillActive(skillId: string) {
  const admin = await requireRole("ADMIN");
  const skill = await prisma.skill.findUnique({ where: { id: skillId }, select: { active: true, name: true } });
  if (!skill) return;
  await prisma.$transaction([
    prisma.skill.update({ where: { id: skillId }, data: { active: !skill.active } }),
    prisma.auditLog.create({ data: { actorId: admin.id, action: skill.active ? "DEACTIVATE_SKILL" : "ACTIVATE_SKILL", entity: "Skill", entityId: skillId, details: { name: skill.name } } }),
  ]);
  revalidatePath("/admin/skills");
}
