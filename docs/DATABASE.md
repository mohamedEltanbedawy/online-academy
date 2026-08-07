# قاعدة البيانات — Family OS
### Database — تصميم الداتابيز وقواعد التغيير

## ١) قواعد التغيير (حرجة)

- **إضافية فقط (Additive):** لا حذف ولا تعديل مكسور على الجداول الموجودة. أي حاجة جديدة تُضاف مع backfill.
- **التطبيق:** `npx prisma migrate dev --create-only` ثم `npx prisma migrate deploy`.
  - الأمر التفاعلي `migrate dev` مرفوض في بيئتنا (shell غير تفاعلي).
  - في حالة migration بسيط على جداول فارغة، نكتب الـ SQL يدويًا ثم deploy.
- **النسخ الاحتياطي:** قبل أي تغيير على الـ schema → `scripts/backup-db.ps1` ثم تجربة استرجاع ناجحة.
- **الأرشيف:** السجلات المالية/التاريخية تُلغى أو تُؤرشف، **لا تُحذف فعليًا**.
- **AuditLog:** كل تعديل إداري يُسجّل (مين + إيه + امتى).

## ٢) النماذج الأساسية (Core)

### عزل المستأجرين — M1 (تم ✅)
- **Tenant** — المستأجر (عائلة/مؤسسة/مزود). المفتاح `slug` فريد.
- **Person** — التوأم الرقمي للإنسان. `userId` اختياري (فريد)، و`externalKey` (فريد) لربط السجلات القديمة (`user:<id>` / `child:<id>`).
- **Family** — عائلة داخل المستأجر مع `headPersonId` اختياري.
- **FamilyMember** — ربط شخص بعائلة + دور (`ولي أمر`/`طفل`/...) + `isPrimary`.
- **Relationship** — علاقة موجهة (من → إلى) + نوع (`PARENT_OF`, `GUARDIAN_OF`, `SPOUSE`, `SIBLING`, `GRANDPARENT_OF`, `OTHER`).

### أعمدة `tenantId` (إضافية، قابلة للخالية)
أُضيفت إلى جداول التشغيل: `Child`, `Class`, `Activity`, `AcademyProgram`, `AcademyStage`, `Skill`, `NurserySubscription`, `Payment`. القيم تعبّأت بالـ backfill لمستأجر "أكاديمية القرية".

## ٣) النظام التعليمي (الموجود — لا يتغير)

`User`, `TeacherProfile`, `StaffProfile`, `Class`, `Enrollment`, `SessionSchedule`, `Homework`, `Submission`, `Recording`, `Payment`, `Payout`, `AuditLog`, `Child`, `ChildGuardian`, `AcademyStage`, `AcademyProgram`, `ChildProgram`, `Skill`, `ChildAssessment`, `ChildAttendance`, `Activity`, `ActivityEnrollment`, `NurserySubscription`, `NurseryInvoice`.

## ٤) migrations الحالية

| الملف | الوصف |
|---|---|
| 20260804030651_init | الأساس (User + TeacherProfile + Class + Enrollment + SessionSchedule) |
| 20260804033451_block2_classes | استكمال بلوك ٢ |
| 20260804202725_block4_homework | الواجبات والحلول |
| 20260804220559_block5_recordings | التسجيلات |
| 20260804223158_block6_payments | الدفع والتسويات |
| 20260805005105_admin_audit_log | سجل الإدارة |
| 20260805005840_teacher_payouts | تسويات المدرسين |
| 20260805011000_paymob_fields | حقول Paymob |
| 20260805095901_nursery_children | سجلات الأطفال |
| 20260805100554_academy_programs | المراحل والبرامج |
| 20260805100904_child_skills | المهارات والتقييم |
| 20260805102415_academy_attendance_activities | الحضور والأنشطة |
| 20260805114309_nursery_billing | اشتراك الحضانة |
| 20260805121000_nursery_invoice_payments | فواتير الحضانة |
| 20260805212446_homework_active | تفعيل/إخفاء الواجب |
| 20260806084351_recording_active | تفعيل/إخفاء التسجيل |
| 20260807020426_family_os_m1_tenancy | **Family OS: Tenant/Person/Family/FamilyMember/Relationship + tenantId** |
| 20260807030000_person_external_key | مفتاح ربط السجلات القديمة |

## ٥) أوامر التشغيل

```bash
cd app
npx prisma migrate dev --create-only --name <اسم>   # إنشاء (بعد تعديل schema)
npx prisma migrate deploy                           # تطبيق
npx prisma generate                                 # توليد العميل (قف الخادم أولًا على Windows)
npm run db:seed                                     # بيانات جاهزة (idempotent)
npm run db:backfill                                 # تحويل M1 (idempotent)
```
