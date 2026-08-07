# دليل المشروع الكامل

هذا الدليل يشرح تركيب مشروع **Online Academy / Family OS**: وظيفة المجلدات، وظيفة الملفات، ومسار البيانات من الشاشة إلى قاعدة البيانات.

## 1. صورة عامة

المشروع عبارة عن منصة تعليمية وإدارة عائلة مبنية على:

- **Next.js App Router**: الصفحات، الخادم، وواجهات API.
- **TypeScript**: لغة كتابة التطبيق.
- **Prisma**: التعامل مع PostgreSQL ومخطط الجداول.
- **PostgreSQL**: قاعدة البيانات.
- **Tailwind CSS**: تنسيق الواجهات.
- **LiveKit**: الحصص المباشرة والصوت والصورة والتسجيل.
- **Paymob**: الدفع الإلكتروني.
- **Gemini/OpenAI/Ollama**: مزودو الذكاء الاصطناعي.
- **Telegram**: قناة ربط ومحادثة مع الأسرة.

التدفق العام:

```text
المستخدم -> صفحة Next.js -> Server Action أو API Route -> lib -> Prisma -> PostgreSQL
                                      |
                                      +-> LiveKit / Paymob / AI / Telegram
```

## 2. ملفات الجذر

| المسار | الوظيفة |
|---|---|
| `docker-compose.yml` | يشغل الخدمات المحلية، وأهمها PostgreSQL وLiveKit وRedis أو خدمات التسجيل حسب الإعداد. |
| `OPERATIONS.md` | تعليمات التشغيل اليومي، الإيقاف، النسخ الاحتياطي، والاسترجاع. |
| `ROADMAP.md` | مراحل المشروع وما تم إنجازه وما هو مخطط لاحقًا. |
| `.gitignore` | يمنع رفع الأسرار، `node_modules`، build output، النسخ الاحتياطية، والملفات المرفوعة. |
| `.env` | متغيرات البيئة المحلية. لا يُرفع إلى GitHub. |
| `recordings/.gitkeep` | يحافظ على مجلد التسجيلات فارغًا داخل Git. |
| `scripts/backup-db.ps1` | ينشئ نسخة PostgreSQL احتياطية. |
| `scripts/restore-db.ps1` | يستعيد قاعدة البيانات من ملف backup. |
| `scripts/register-scheduled-tasks.ps1` | يربط النسخ الاحتياطي بمهام Windows المجدولة. |

## 3. مجلد `app`

هذا هو تطبيق Next.js الفعلي.

| الملف | الوظيفة |
|---|---|
| `package.json` | أسماء أوامر المشروع والمكتبات وسكربتات `dev` و`build` و`lint` و`db:seed`. |
| `package-lock.json` | يثبت إصدارات المكتبات حتى تكون بيئة التثبيت متطابقة. |
| `tsconfig.json` | إعداد TypeScript والمسارات والفحص النوعي. |
| `postcss.config.mjs` | إعداد PostCSS/Tailwind. |
| `.env.example` | نموذج متغيرات البيئة المطلوب نسخ فكرته إلى `.env`. |
| `.env` | متغيرات تشغيل التطبيق المحلية، ويجب عدم مشاركته. |
| `.gitignore` | استثناء ملفات Next.js والمكتبات والملفات المرفوعة والأسرار. |
| `AGENTS.md` | قواعد خاصة بتشغيل وتعديل نسخة Next.js الموجودة في التطبيق. |
| `src/proxy.ts` | طبقة حماية وتوجيه الطلبات قبل وصولها للصفحات، مثل التحقق من الجلسة والمسارات المحمية. |
| `uploads/` | ملفات الصحة المرفوعة محليًا. لا تُرفع إلى Git لأنها قد تحتوي بيانات حساسة. |

## 4. قاعدة البيانات: `app/prisma`

### الملفات الرئيسية

| الملف | الوظيفة |
|---|---|
| `schema.prisma` | المصدر الرئيسي لتعريف كل الجداول والعلاقات والـ enums في قاعدة البيانات. |
| `seed.ts` | ينشئ الحسابات، البيانات التعليمية، بيانات الأسرة، بيانات الصحة، الصلاحيات، AI، وTelegram التجريبية. قابل لإعادة التشغيل دون تكرار مقصود. |
| `backfill-m1.ts` | يملأ بيانات مرحلة العزل بالمستأجرين ويربط السجلات القديمة بالمستأجر المناسب. |
| `generate-nursery-invoices.ts` | ينشئ فواتير الحضانة المستحقة من الاشتراكات. |
| `migrations/migration_lock.toml` | يثبت نوع قاعدة البيانات الذي تستخدمه Prisma Migrate. |

### مجموعات الجداول في `schema.prisma`

- `User`, `TeacherProfile`, `StaffProfile`: الحساب وبيانات المدرس والأخصائي.
- `Class`, `Enrollment`, `SessionSchedule`: الفصول، اشتراك الطالب، والجدول الأسبوعي.
- `Homework`, `Submission`: الواجبات وتسليمات الطلاب ودرجاتهم.
- `Recording`: تسجيلات الحصص المباشرة.
- `Payment`, `Payout`: مدفوعات الطلاب ومستحقات المدرسين.
- `AuditLog`: سجل ما يفعله المستخدمون الإداريون.
- `Child`, `ChildGuardian`: ملفات الأطفال وروابط أولياء الأمور.
- `AcademyStage`, `AcademyProgram`, `ChildProgram`: المراحل والبرامج وخطة الطفل.
- `Skill`, `ChildAssessment`: المهارات وتقييمات الأطفال.
- `ChildAttendance`, `Activity`, `ActivityEnrollment`: الحضور والأنشطة والتسجيل فيها.
- `NurserySubscription`, `NurseryInvoice`: اشتراكات وفواتير الحضانة.
- `Tenant`, `Person`, `Family`, `FamilyMember`, `Relationship`: أساس Family OS وعزل العائلات.
- `FamilyEvent`, `PlanItem`: تقويم الأسرة وخطتها اليومية.
- `GrowthRecord`, `Vaccination`, `SleepRecord`, `NutritionRecord`, `Medicine`, `HealthDocument`: الملف الصحي.
- `AiProvider`: مزودو وموديلات الذكاء الاصطناعي.
- `Permission`, `AccessRole`, `RolePermission`, `UserRole`: نظام RBAC والصلاحيات.
- `TelegramChat`, `TelegramLinkCode`: ربط محادثات Telegram بحسابات المستخدمين.

### مجلد `migrations`

كل مجلد يحتوي `migration.sql` يمثل تغييرًا تاريخيًا إضافيًا على قاعدة البيانات. الترتيب يبدأ بالتهيئة، ثم الفصول والواجبات والتسجيلات والمدفوعات والحضانة، ثم مراحل Family OS والصحة والـ AI والصلاحيات وTelegram.

أهم الترحيلات الأخيرة:

- `20260807020426_family_os_m1_tenancy`: إضافة المستأجر والعزل.
- `20260807023136_family_os_m2_calendar_plan`: تقويم وخطة الأسرة.
- `20260807035754_family_os_m3_health_ai_permissions`: الصحة والـ AI والصلاحيات.
- `20260807043448_family_os_m3_telegram`: Telegram والربط المؤقت.

## 5. الصفحات: `app/src/app`

في Next.js، كل مجلد يحتوي `page.tsx` يمثل رابطًا في المتصفح، والجزء `[id]` يعني قيمة ديناميكية.

### ملفات التطبيق العامة

| المسار | الوظيفة |
|---|---|
| `layout.tsx` | الغلاف العام لكل الصفحات، اتجاه RTL، اللغة، الخطوط والبيانات العامة. |
| `page.tsx` | الصفحة الرئيسية. |
| `globals.css` | الألوان، الأزرار، التخطيط، RTL، والطباعة. |
| `auth/login/page.tsx` | شاشة تسجيل الدخول. |
| `auth/register/page.tsx` | إنشاء حساب جديد. |
| `join/page.tsx` | الانضمام إلى فصل بكود الدعوة. |
| `dashboard/page.tsx` | يوجه المستخدم إلى اللوحة المناسبة لدوره. |
| `profile/page.tsx` | عرض الملف الشخصي. |

### لوحة المدرس: `teacher`

| المسار | الوظيفة |
|---|---|
| `teacher/page.tsx` | ملخص فصول المدرس. |
| `teacher/profile/page.tsx` | تعديل ملف المدرس ومادته وأسعاره. |
| `teacher/classes/new/page.tsx` | إنشاء فصل جديد. |
| `teacher/classes/[id]/page.tsx` | تفاصيل فصل محدد. |
| `teacher/classes/[id]/room/page.tsx` | دخول غرفة الحصة المباشرة. |
| `teacher/classes/[id]/recordings/page.tsx` | عرض تسجيلات الفصل. |
| `teacher/classes/[id]/homework/page.tsx` | قائمة واجبات الفصل. |
| `teacher/classes/[id]/homework/new/page.tsx` | إنشاء واجب. |
| `teacher/classes/[id]/homework/[homeworkId]/page.tsx` | عرض التسليمات والتصحيح. |

### لوحة الطالب: `student`

| المسار | الوظيفة |
|---|---|
| `student/page.tsx` | فصول الطالب وملخصه. |
| `student/classes/[id]/page.tsx` | تفاصيل فصل الطالب. |
| `student/classes/[id]/room/page.tsx` | الحصة المباشرة. |
| `student/classes/[id]/recordings/page.tsx` | تسجيلات الفصل. |
| `student/classes/[id]/homework/page.tsx` | واجبات الطالب. |
| `student/classes/[id]/homework/[homeworkId]/page.tsx` | عرض الواجب وتسليمه. |
| `student/classes/[id]/payments/new/page.tsx` | بدء دفع متعلق بالفصل. |

### لوحة ولي الأمر والحضانة

| المسار | الوظيفة |
|---|---|
| `parent/page.tsx` | ملخص الأطفال والأنشطة والفواتير. |
| `parent/children/[id]/page.tsx` | ملف طفل محدد. |
| `parent/children/[id]/attendance/page.tsx` | حضور الطفل. |
| `parent/activities/page.tsx` | أنشطة الأطفال. |
| `parent/billing/page.tsx` | الاشتراكات والفواتير. |
| `parent/billing/[invoiceId]/pay/page.tsx` | دفع فاتورة محددة. |
| `staff/page.tsx` | لوحة الأخصائي أو موظف الحضانة. |
| `staff/children/[id]/page.tsx` | متابعة طفل من جانب الأخصائي. |

### لوحة التحصيل

| المسار | الوظيفة |
|---|---|
| `cashier/page.tsx` | ملخص التحصيل. |
| `cashier/payments/page.tsx` | كل المدفوعات. |
| `cashier/payments/new/page.tsx` | تسجيل دفعة جديدة. |
| `cashier/payments/[id]/page.tsx` | تفاصيل إيصال. |
| `cashier/nursery/page.tsx` | تحصيل فواتير الحضانة. |

### Family OS: `family`

| المسار | الوظيفة |
|---|---|
| `family/page.tsx` | الصفحة الرئيسية للأسرة وملخص الأطفال. |
| `family/members/page.tsx` | أفراد الأسرة وعلاقاتهم. |
| `family/calendar/page.tsx` | التقويم الزمني. |
| `family/events/page.tsx` | إدارة الأحداث والمواعيد. |
| `family/plan/page.tsx` | الخطة اليومية والمهام. |
| `family/health/[id]/page.tsx` | عرض صحة طفل لولي الأمر المصرح له. |

### لوحة الإدارة: `admin`

| المسار | الوظيفة |
|---|---|
| `admin/page.tsx` | الصفحة الرئيسية للإدارة. |
| `admin/users/page.tsx` | قائمة المستخدمين. |
| `admin/users/new/page.tsx` | إنشاء مستخدم. |
| `admin/users/[id]/edit/page.tsx` | تعديل مستخدم. |
| `admin/users/[id]/permissions/page.tsx` | أدوار وصلاحيات مستخدم محدد. |
| `admin/permissions/page.tsx` | إدارة كتالوج الصلاحيات والأدوار. |
| `admin/audit/page.tsx` | سجل العمليات الإدارية. |
| `admin/children/page.tsx` | كل ملفات الأطفال. |
| `admin/children/new/page.tsx` | إضافة طفل. |
| `admin/children/[id]/page.tsx` | تفاصيل الطفل وروابط التعليم والصحة. |
| `admin/children/[id]/edit/page.tsx` | تعديل بيانات الطفل. |
| `admin/children/[id]/attendance/page.tsx` | حضور الطفل. |
| `admin/children/[id]/health/page.tsx` | تبويبات الملف الصحي. |
| `admin/children/[id]/health/ai/page.tsx` | إدخال نص أو صورة وتحويلها لبيانات صحية بالـ AI. |
| `admin/children/[id]/health/report/page.tsx` | تقرير صحي منسق للطباعة أو PDF. |
| `admin/classes/page.tsx` | إدارة الفصول. |
| `admin/classes/new/page.tsx` | إنشاء فصل إداريًا. |
| `admin/classes/[id]/edit/page.tsx` | تعديل فصل. |
| `admin/homework/page.tsx` | إدارة الواجبات. |
| `admin/homework/[id]/edit/page.tsx` | تعديل واجب. |
| `admin/recordings/page.tsx` | إدارة التسجيلات. |
| `admin/payments/page.tsx` | متابعة المدفوعات. |
| `admin/payouts/page.tsx` | مستحقات المدرسين وتصديرها. |
| `admin/programs/page.tsx` | مراحل وبرامج التعليم. |
| `admin/programs/[id]/edit/page.tsx` | تعديل برنامج. |
| `admin/skills/page.tsx` | إدارة المهارات. |
| `admin/activities/page.tsx` | الأنشطة. |
| `admin/activities/[id]/edit/page.tsx` | تعديل نشاط. |
| `admin/nursery/billing/page.tsx` | فواتير واشتراكات الحضانة. |
| `admin/nursery/billing/subscriptions/[id]/edit/page.tsx` | تعديل اشتراك. |
| `admin/nursery/billing/invoices/[id]/edit/page.tsx` | تعديل فاتورة. |
| `admin/ai/page.tsx` | قائمة مزودي الذكاء الاصطناعي وتفعيلهم. |
| `admin/ai/[id]/edit/page.tsx` | تعديل موديل أو مزود AI. |
| `admin/telegram/page.tsx` | تعليمات Telegram، المحادثات، وأكواد الربط. |

## 6. Server Actions: `app/src/app/actions`

هذه ملفات خادم تستدعيها النماذج والصفحات مباشرة. هي مكان عمليات الكتابة والتحقق من المستخدم قبل استدعاء Prisma.

| الملف | الوظيفة |
|---|---|
| `auth.ts` | إنشاء الحساب، الدخول، الخروج، وإنشاء الجلسة. |
| `admin.ts` | عمليات الإدارة العامة والمستخدمين. |
| `children.ts` | إنشاء وتعديل وربط الأطفال. |
| `academy.ts` | المراحل والبرامج والمهارات والتقييمات. |
| `classes.ts` | إنشاء الفصول والانضمام إليها والجدولة. |
| `teacher.ts` | ملف المدرس وجداول الحصص. |
| `homework.ts` | إنشاء الواجبات، التسليم، والتصحيح. |
| `activities.ts` | إنشاء الأنشطة وتسجيل الأطفال فيها. |
| `payments.ts` | المدفوعات وإيصالات التحصيل. |
| `billing.ts` | اشتراكات وفواتير الحضانة. |
| `family.ts` | أفراد الأسرة والأحداث والخطة اليومية. |
| `health.ts` | إضافة وتعديل وحذف السجلات الصحية. |
| `health-ai.ts` | تحليل النصوص والصور الصحية ثم معاينة وحفظ النتيجة. |
| `ai.ts` | إضافة وتعديل وتفعيل مزودي AI. |
| `permissions.ts` | تعديل أدوار وصلاحيات المستخدمين. |
| `telegram.ts` | إنشاء رمز ربط Telegram. |

## 7. API Routes: `app/src/app/api`

كل `route.ts` هو endpoint HTTP مستقل.

| المسار | الوظيفة |
|---|---|
| `api/livekit/token/route.ts` | إصدار رمز دخول لغرفة LiveKit بعد التحقق من المستخدم. |
| `api/livekit/mute/route.ts` | تنفيذ كتم مشارك في الحصة. |
| `api/recordings/start/route.ts` | بدء تسجيل الحصة. |
| `api/recordings/stop/route.ts` | إيقاف التسجيل وتحديث حالته. |
| `api/recordings/[recordingId]/route.ts` | خدمة أو جلب تسجيل محدد. |
| `api/payments/paymob/start/route.ts` | بدء معاملة Paymob. |
| `api/payments/paymob/nursery-start/route.ts` | بدء دفع فاتورة حضانة. |
| `api/payments/paymob/webhook/route.ts` | استقبال نتيجة الدفع من Paymob. |
| `api/admin/payouts/export/route.ts` | تصدير مستحقات المدرسين. |
| `api/health/route.ts` | endpoint عام متعلق ببيانات الصحة. |
| `api/health/documents/route.ts` | رفع وفتح مستندات الصحة مع فحص الصلاحية. |
| `api/telegram/webhook/route.ts` | يستقبل تحديثات Telegram ويرسلها لمعالج البوت. |
| `api/telegram/setwebhook/route.ts` | يطلب من Telegram تسجيل عنوان webhook. |

## 8. المكونات: `app/src/components`

المكونات تعزل الواجهة التفاعلية عن الصفحات. معظم النماذج Client Components لأنها تحتاج إدخالًا أو انتقالًا أو `window`.

### مكونات عامة

| الملف | الوظيفة |
|---|---|
| `app-shell.tsx` | شريط التنقل، الهوية، والهيكل العام بعد الدخول. |
| `login-form.tsx` | نموذج تسجيل الدخول. |
| `register-form.tsx` | نموذج إنشاء الحساب. |
| `logout-button.tsx` | تسجيل الخروج. |
| `language-switcher.tsx` | تبديل العربية والإنجليزية. |
| `print-button.tsx` | استدعاء طباعة المتصفح للتقارير. |
| `telegram-link-button.tsx` | إنشاء وعرض رابط ربط Telegram. |
| `paymob-checkout.tsx` | واجهة إتمام الدفع الإلكتروني. |
| `cashier-payment-form.tsx` | تسجيل دفعة نقدية أو إلكترونية. |
| `recording-control.tsx` | أزرار بدء وإيقاف التسجيل. |
| `live-room.tsx` | غرفة LiveKit ومكونات الحصة المباشرة. |
| `live-whiteboard.tsx` | السبورة التفاعلية داخل الحصة. |
| `skill-create-form.tsx` | إنشاء مهارة. |

### `components/teacher`

- `create-class-form.tsx`: إنشاء فصل.
- `create-homework-form.tsx`: إنشاء واجب.
- `add-schedule-form.tsx`: إضافة حصة للجدول.
- `grade-submission-form.tsx`: إدخال الدرجة والتغذية الراجعة.
- `teacher-profile-form.tsx`: تعديل ملف المدرس.
- `invite-code.tsx`: عرض كود الانضمام للفصل.

### `components/student` و`components/parent`

- `student/join-class-form.tsx`: الانضمام بفعل كود الفصل.
- `student/submit-homework-form.tsx`: تسليم إجابة الواجب.
- `parent/add-child-form.tsx`: إضافة طفل لولي الأمر.
- `nursery-subscription-form.tsx`: إنشاء اشتراك حضانة.
- `nursery-invoice-payment-form.tsx`: دفع فاتورة حضانة.

### `components/health`

- `health-forms.tsx`: نماذج النمو والتطعيم والنوم والتغذية والدواء وتبويبات الصحة.
- `health-upload-form.tsx`: رفع مستند صحي.
- `ai-health-entry.tsx`: إدخال نص أو صورة وعرض المعاينة قبل الحفظ.
- `delete-health-button.tsx`: حذف سجل صحي بعد التأكيد.

### `components/family` و`components/academy`

- `family/event-form.tsx`: إنشاء حدث عائلي.
- `family/plan-item-form.tsx`: إنشاء مهمة أو نشاط في الخطة.
- `academy/attendance-form.tsx`: تسجيل حضور.
- `academy/assessment-form.tsx`: تقييم مهارة طفل.
- `academy/assign-program-form.tsx`: إسناد برنامج لطفل.
- `academy/edit-child-form.tsx`: تعديل طفل.
- `academy/edit-program-form.tsx`: تعديل برنامج.

### مكونات الإدارة

- `admin-create-user-form.tsx` و`admin-edit-user-form.tsx`: إنشاء وتعديل المستخدمين.
- `admin-create-child-form.tsx`: إنشاء طفل.
- `admin-create-class-form.tsx` و`admin-edit-class-form.tsx`: إدارة الفصل.
- `admin-edit-homework-form.tsx`: تعديل الواجب.
- `admin-program-forms.tsx`: نماذج البرامج والمراحل.
- `activity-form.tsx` و`edit-activity-form.tsx`: إنشاء وتعديل النشاط.
- `ai-provider-form.tsx`: إعداد مزود AI وموديله ومفتاحه.
- `edit-nursery-subscription-form.tsx`: تعديل اشتراك الحضانة.
- `edit-nursery-invoice-form.tsx`: تعديل الفاتورة.

## 9. طبقة الخدمات: `app/src/lib`

هذه الطبقة تحتوي منطق النظام القابل لإعادة الاستخدام، ولا ينبغي وضع منطق قاعدة البيانات المتكرر داخل كل صفحة.

| الملف | الوظيفة |
|---|---|
| `prisma.ts` | Prisma Client واحد مشترك بين عمليات الخادم. |
| `auth.ts` | جلب المستخدم الحالي وفحص تسجيل الدخول والدور. |
| `session.ts` | تشفير وفك تشفير JWT داخل cookie اسمها `session`. |
| `tenant.ts` | تحديد المستأجر الحالي ومنع تسرب بيانات عائلة إلى أخرى. |
| `family.ts` | استعلامات أفراد الأسرة والأحداث والخطط. |
| `health.ts` | استعلامات وتجميع بيانات الملف الصحي وحسابات مثل BMI. |
| `health-save.ts` | تحويل نتيجة AI إلى سجلات صحية وحفظها بشكل مترابط. |
| `permissions.ts` | `hasPermission` والتحقق من أدوار RBAC. |
| `ai.ts` | واجهة موحدة لاستدعاءات النص وJSON والرؤية عبر Gemini/OpenAI/Ollama. |
| `telegram.ts` | التوكن، إرسال الرسائل، إنشاء واسترداد أكواد الربط. |
| `telegram-handler.ts` | منطق أوامر `/start` و`/link` والصحة والرسائل والصور. |
| `paymob.ts` | توقيع واستدعاء Paymob وبناء معاملات الدفع. |
| `i18n.ts` | قاموس الترجمة ومطابقة النصوص بين العربية والإنجليزية. |
| `i18n-server.ts` | تحديد اللغة في Server Components. |
| `format.ts` | تنسيق الأرقام والتواريخ والقيم للعرض. |

## 10. التشغيل والبنية الخارجية

### `livekit`

| الملف | الوظيفة |
|---|---|
| `livekit.yaml` | إعداد LiveKit المحلي الفعلي. |
| `livekit.example.yaml` | نموذج إعداد يمكن استخدامه كبداية. |
| `egress.yaml` | إعداد خدمة إخراج وتسجيل الحصص. |

### `docs`

| الملف | الوظيفة |
|---|---|
| `ARCHITECTURE.md` | شرح الطبقات والاختيارات المعمارية. |
| `DATABASE.md` | توثيق الجداول والعلاقات وقواعد العزل. |
| `MIGRATION.md` | طريقة إنشاء وتطبيق الترحيلات بأمان. |
| `DECISIONS.md` | القرارات التصميمية المهمة وأسبابها. |
| `MODULES.md` | خريطة وحدات المنصة وحالتها. |
| `AI.md` | استراتيجية الذكاء الاصطناعي والموديلات والخصوصية. |
| `PROJECT_GUIDE.md` | هذا الدليل الشامل لملفات ومجلدات المشروع. |

## 11. قواعد مهمة للمطور

- لا تضع مفاتيح API أو كلمات المرور داخل الكود أو Git.
- أي بيانات تخص عائلة يجب أن تمر عبر `tenantId` أو فحص ملكية واضح.
- عمليات التعديل والحذف يجب أن تكون في Server Actions أو API Routes مع فحص الجلسة والصلاحية.
- لا تشغّل `prisma generate` أثناء وجود عملية Node تستخدم Prisma إذا ظهر خطأ `EPERM`.
- بعد تعديل `schema.prisma`: أنشئ migration، طبّقها، ثم شغّل `prisma generate` وفحوصات TypeScript.
- `seed.ts` مخصص لبيانات العرض والتجربة، وليس بيانات العملاء الحقيقية.
- مجلدات `.next` و`node_modules` و`uploads` و`backups` ليست كودًا مصدرًا ولا تُشرح كملفات تطبيقية.

## 12. أوامر التشغيل الأساسية

من داخل `app`:

```powershell
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run db:seed
```

الرابط المحلي:

```text
http://localhost:3000
```

لوحة الإدارة:

```text
http://localhost:3000/admin
```
