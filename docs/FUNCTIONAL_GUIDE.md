# الدليل الوظيفي — شرح كل وحدة في المنصة

هذا الدليل يشرح **ماذا تفعل** كل وحدة في المنصة من منظور العمل والمستخدم، وليس من منظور الملفات. راجع `PROJECT_GUIDE.md` لمعرفة أين تقع الملفات.

---

## ١. وحدة المستخدمين والمصادقة

### الفكرة الأساسية

المنصة تخدم 6 أنواع من المستخدمين (يحددها enum `Role`):

| الدور | ماذا يفعل |
|---|---|
| ADMIN | المشرف العام — يدير المنصة كلها من لوحة الإدارة. |
| TEACHER | المدرس — ينشئ فصولاً ويصحح واجبات ويدير الحصص. |
| STUDENT | الطالب — ينضم للفصول ويسلّم واجبات ويدفع. |
| PARENT | ولي الأمر — يتابع أطفاله وصحتهم وحضورهم. |
| STAFF | الأخصائي — يقيّم مهارات الأطفال ويسجّل الحضور. |
| CASHIER | موظف التحصيل — يسجّل المدفوعات النقدية والإلكترونية. |

### تدفق الدخول

```text
1. المستخدم يملأ نموذج LoginForm
2. Server Action `auth.ts` يقارن كلمة المرور مع `passwordHash`
3. إذا نجحت → `session.ts` ينشئ JWT مشفر بـ HS256 ويضعه في cookie باسم "session"
4. الـ proxy وجميع الصفحات تقرأ الجلسة عبر `lib/auth.ts` وتتحقق من الدور
5. AppShell يعرض قائمة التنقل حسب الدور (مدرس ≠ طالب ≠ أدمن)
```

### ما يحدث عند إنشاء الحساب

- `auth.ts` يفحص أن البريد والهاتف غير مكررين.
- يُشفر كلمة المرور بـ `bcryptjs` ويُحفظ `passwordHash`.
- يُسند دور واحد فقط (`role` في `User`).
- في seed، يُسند أيضًا دور في نظام RBAC الجديد عبر `AccessRole` + `UserRole`.

### الجلسات

- `session.ts` يستخدم مكتبة `jose` (وليست `jsonwebtoken`).
- payload الجلسة: `{ userId, role }` صالحة 7 أيام.
- الكوكي `httpOnly` لمنع سرقته من JavaScript.
- key التشفير هو `AUTH_SECRET` من `.env`.

---

## ٢. وحدة التعليم — الفصول والواجبات

### الفكرة

مدرس ينشئ فصلًا (Class)، الطلاب ينضمون إليه، تُحدد حصص أسبوعية، يضع المدرس واجبات، والطلاب يسلّمون إجابات تُصحح.

### تدفق الفصل

```text
Teacher → createClassForm → classes.ts action → Class + SessionSchedule
Student → joinClassForm (بكود inviteCode) → classes.ts → Enrollment
```

### نموذج الربح

المنصة تميز بين نوعين من الطلاب:

| المصدر | المعنى | نصيب المنصة |
|---|---|---|
| PLATFORM | الطالب جاء من دعاية المنصة | المنصة تأخذ نسبة مئوية من سعر الحصة |
| TEACHER | الطالب جاء مع المدرس | المنصة تأخذ كلفة ثابتة فقط |

هذا يحدده حقل `source` في `Enrollment` وحقول `platformPercent` و`fixedFee` في `Class`.

### الواجبات والتسليم

```text
Teacher → CreateHomeworkForm → homework.ts → Homework
Student → SubmitHomeworkForm → homework.ts → Submission (status=SUBMITTED)
Teacher → GradeSubmissionForm → homework.ts → Submission (status=GRADED, score, feedback)
```

الطالب الواحد لا يستطيع تسليم أكثر من إجابة واحدة لنفس الواجب (قيد `@@unique([homeworkId, studentId])`).

### الحصة المباشرة (LiveKit)

- `live-room.tsx` هو المكون الرئيسي.
- `api/livekit/token` يصدر توكن مؤقتًا للمستخدم بعد التحقق من عضويته في الفصل.
- التسجيل: `api/recordings/start` و`api/recordings/stop` تتحكم في Egress.
- `live-whiteboard.tsx` سبورة تفاعلية بـ tldraw.

---

## ٣. وحدة الحضانة والأطفال

### الفكرة

الأكاديمية تستقبل أطفالاً من سن الحضانة إلى الإعدادي، تسجّل حضورهم، تقيّم مهاراتهم، وتُسند لهم برامج تعليمية.

### تدفق الطفل

```text
Admin/Parent → AddChildForm → children.ts → Child + ChildGuardian
Staff/Admin → AttendanceForm → activities.ts → ChildAttendance
Staff → AssessmentForm → academy.ts → ChildAssessment
Admin → AssignProgramForm → academy.ts → ChildProgram
```

### الحضور

- كل طفل له سجل حضور يومي (`ChildAttendance`).
- يمكن أن يكون الحضور **حضوريًا** (ONSITE) أو **أونلاين** (ONLINE).
- الحالة: PRESENT أو ABSENT أو LATE.
- القيد `@@unique([childId, date, mode])` يمنع تسجيل نفس اليوم بنفس الوضع مرتين.

### البرامج والمهارات

- `AcademyStage`: مرحلة تعليمية (استقبال، KG1، KG2، ابتدائي، إعدادي).
- `AcademyProgram`: برنامج في كل مرحلة (المنهج الرسمي + English + US Math + مهارات).
- `ChildProgram`: نسخة مخصصة من البرنامج لطفل معين بخطة إضافية.
- `Skill`: مهارة قابلة للتقييم (لغوي، رياضي، اجتماعي، حركي، فني، معرفي).
- `ChildAssessment`: درجة تقييم الطفل في مهارة معينة من قبل أخصائي.

---

## ٤. وحدة الدفع والتحصيل

### أنواع المدفوعات

| النوع | المنفذ | الجدول |
|---|---|---|
| دفع حصة تعليمية | Cashier / Paymob | Payment |
| دفع فاتورة حضانة | Cashier / Paymob | Payment + NurseryInvoice |
| مستحقات المدرس | تلقائي عند الدفع | Payout |

### تدفق الدفع النقدي

```text
Cashier → CashierPaymentForm → payments.ts → Payment (method=CASH, status=PAID)
                                        → Payout (تحسب تلقائيًا حسب نموذج الربح)
```

### تدفق الدفع الإلكتروني

```text
Student/Parent → PaymobCheckout → api/payments/paymob/start → Paymob iframe
Paymob webhook → api/payments/paymob/webhook → payments.ts → Payment (method=GATEWAY, status=PAID)
```

### الاشتراكات والفواتير (الحضانة)

- `NurserySubscription`: اشتراك شهري لطفل في الحضانة (الباقة، المبلغ، الخصم، تاريخ الاستحقاق).
- `NurseryInvoice`: فاتورة شهرية مرتبطة باشتراك، تُنشأ تلقائيًا أو يدويًا.
- سكريبت `generate-nursery-invoices.ts` يفحص الاشتراكات النشطة ويُنشئ فواتير مستحقة.

### مستحقات المدرس (Payout)

عند كل دفعة، يحسب النظام:
- إذا المصدر `PLATFORM`: `platformFee = المبلغ × النسبة`، `teacherAmount = المبلغ - platformFee`
- إذا المصدر `TEACHER`: `platformFee = fixedFee`، `teacherAmount = المبلغ - fixedFee`

---

## ٥. Family OS — طبقة العائلة (الأساس)

### الفكرة

كل عائلة **مستأجر** مستقل (Tenant). داخل المستأجر توجد **أشخاص** (Person) يمثلون الأب والأم والأطفال، وتوجد **العائلة** (Family) التي تجمعهم، و**علاقات** (Relationship) بينهم.

هذه الطبقة هي نواة تحويل المنصة من "أكاديمية فقط" إلى "نظام تشغيل العائلة".

### هيكل العائلة

```text
Tenant "عائلة محمد"
  ├── Person "محمد" (userId → parent account)
  ├── Person "فاطمة" (userId → parent account 2)
  ├── Person "أحمد" (userId → null، طفل بلا حساب)
  └── Person "سارة" (externalKey → child:xxx)
  
  Family "الأسرة"
    ├── FamilyMember: محمد (أب، isPrimary=true)
    ├── FamilyMember: فاطمة (أم)
    ├── FamilyMember: أحمد (طفل)
    └── FamilyMember: سارة (طفل)
  
  Relationship: محمد → PARENT_OF → أحمد
  Relationship: فاطمة → PARENT_OF → سارة
```

### العزل بين العائلات

- كل البيانات تنتمي لـ `tenantId`.
- `lib/tenant.ts` يحدد المستأجر من الجلسة.
- أي استعلام لقاعدة البيانات يمرر `tenantId` في WHERE.
- لا يمكن لعائلة رؤية بيانات عائلة أخرى.

### الربط بين الشخص والمستخدم

- `Person.userId` اختياري — ليس كل شخص له حساب دخول (مثلاً: طفل صغير).
- `Person.externalKey` يربط الشخص بسجل `Child` القديم بصيغة `child:<id>`.
- `lib/health-save.ts` يستخدم `getGuardianChildren` ليجلب أطفال ولي الأمر عبر `ChildGuardian` (وليس `Person`).

---

## ٦. Family OS — التقويم والخطة اليومية

### تقويم العائلة (FamilyEvent)

- أحداث زمنية على مستوى العائلة: حصص، مواعيد طبيب، أعياد ميلاد، مناسبات.
- كل حدث له `startsAt` و`endsAt` اختياري و`location` و`type`.
- يمكن ربطه بعائلة معينة أو أن يكون عامًا على المستأجر.
- الصفحة: `family/calendar` تعرض تقويمًا زمنيًا، `family/events` تعرض القائمة.

### الخطة اليومية (PlanItem)

- ليست تقويمًا وإنما **قائمة مهام يومية** للأسرة.
- كل عنصر له `day` (التاريخ فقط بدون وقت)، `time` (اختياري: "HH:mm")، `type` (TASK/LESSON/ACTIVITY/REMINDER).
- يمكن إسناده لشخص معين في الأسرة (`assignedToId`).
- حالة `done` = تم الإنجاز.
- الصفحة: `family/plan` تعرض خطة اليوم مع إمكانية إضافة وتعديل.

---

## ٧. وحدة الصحة

### نظرة عامة

الملف الصحي للطفل يتكون من 6 أقسام، كل قسم له جدول منفصل في قاعدة البيانات وجزء منفصل في الواجهة كـ tab.

### الأقسام

#### أ) النمو (GrowthRecord)

- يسجل الوزن (كجم)، الطول (سم)، ومحيط الرأس (سم) في تاريخ معين.
- الصفحة تحسب BMI تلقائيًا للعرض: `الوزن / (الطول/100)^2`.
- البيانات تُخزن بـ `Decimal` وتُعرض عبر helper `num()` الذي يستدعي `.toNumber()`.

#### ب) التطعيمات (Vaccination)

- اسم التطعيم، الجرعة، تاريخ الإعطاء، وتاريخ الجرعة التالية.
- الصفحة تنبه بتنبيه أصفر إذا كان `nextDueDate` قد مضى دون تطعيم جديد مسجل.

#### ج) النوم (SleepRecord)

- عدد ساعات النوم وجودته (جيدة / متوسطة / سيئة) في تاريخ معين.

#### د) التغذية (NutritionRecord)

- الوجبة (فطار/غداء/عشاء)، والأطعمة المتناولة.

#### هـ) الأدوية (Medicine)

- اسم الدواء، الجرعة، التكرار، تاريخ البداية والنهاية.
- له حالة `active` — يمكن إيقاف الدواء دون حذفه لتتبع التاريخ الدوائي.

#### و) الملفات (HealthDocument)

- مستندات مرفوعة محليًا: تقارير طبية، شهادات تطعيم، وصفات.
- تُرفع عبر `api/health/documents` وتُحفظ في `uploads/health/<childId>/`.
- الوصول محمي: فقط من يملك صلاحية `health:documents` يستطيع رفعها، ومن يملك `health:view` يستطيع فتحها.

### التقرير الصحي

- صفحة `admin/children/[id]/health/report` تجمع بيانات كل الأقسام في جدول واحد قابل للطباعة عبر `PrintButton` الذي يستدعي `window.print()`.

---

## ٨. وحدة الذكاء الاصطناعي

### إدارة الموديلات

- صفحة `admin/ai` تسمح للمشرف بإدارة مزودي الـ AI:
  - إضافة مزود: Gemini / OpenAI / Ollama.
  - تحديد اسم الموديل ودرجة الحرارة وعدد الرموز القصوى.
  - تعيين `apiKey` (يُحفظ في قاعدة البيانات وليس في الكود).
  - تفعيل/تعطيل أي مزود.
  - جعل مزود هو الافتراضي لكل النظام.
  - دعم الرؤية بالصور (`supportsVision`) — Gemini يدعمها، Ollama لا.

### الطبقة الموحدة `lib/ai.ts`

ثلاث دوال موحدة تعمل مع أي مزود مفعّل:

| الدالة | الوظيفة |
|---|---|
| `askText(prompt)` | إرسال نص واستقبال رد نصي |
| `askJson(prompt, schema)` | إرسال نص واستقبال JSON منظم مع التحقق من صحته |
| `askVision(prompt, imageBase64)` | إرسال صورة + نص واستقبال رد (للموديلات التي تدعم الرؤية) |

المنطق الداخلي:
1. يبحث عن المزود الافتراضي المفعّل.
2. إذا كان Gemini → يستدعي Google Generative Language API.
3. إذا كان OpenAI → يستدعي OpenAI Chat Completions.
4. إذا كان Ollama → يستدعي `{baseUrl}/api/chat`.

### دخول البيانات الصحية بالـ AI

- صفحة `admin/children/[id]/health/ai`:
  - **الخيار الأول**: الصق نصًا حرًا (مثلاً: "الطفل وزنه 12 كجم وطوله 95 سم، أخد تطعيم الحصبة يوم 5 أغسطس").
  - **الخيار الثاني**: ارفع صورة (كارت متابعة، شهادة تطعيم).
- `health-ai.ts` يرسل النص أو الصورة إلى `ai.ts` مع prompt يطلب JSON.
- النتيجة تُعرض للمستخدم **للمعاينة** قبل الحفظ (مكون `ai-health-entry.tsx`).
- عند الموافقة: `health-save.ts` يأخذ JSON ويحوله إلى سجلات فعلية في الجداول الصحية.
- `saveParsedHealthData` يرجع `{ ok: true, counts }` عند النجاح أو `{ ok: false, error }` عند الفشل.

---

## ٩. وحدة الصلاحيات (RBAC)

### الفكرة

بدلاً من أن يكون لكل دور صلاحيات ثابتة في الكود، النظام يعتمد نموذجًا مرنًا:

```text
المستخدم → UserRole → AccessRole → RolePermission → Permission
```

### مكونات النظام

| الجدول | الوظيفة |
|---|---|
| `Permission` | صلاحية واحدة محددة بـ code (مثلاً: `health:manage`) |
| `AccessRole` | دور مسمى (مثلاً: "مشرف عام") — تجميع للصلاحيات |
| `RolePermission` | يربط دورًا بصلاحية |
| `UserRole` | يربط مستخدمًا بدور — المستخدم قد يكون له أكثر من دور |

### أدوار النظام الأساسية (isSystem=true، لا تُحذف)

| الدور | الصلاحيات |
|---|---|
| ADMIN | كل الصلاحيات الـ 22 |
| STAFF | dashboard, children, health, staff, family, ai |
| TEACHER | dashboard, classes, teacher, family |
| STUDENT | dashboard, student, family |
| PARENT | dashboard, children:view, health:view, family |
| CASHIER | dashboard, payments, cashier, family |

### كيف يُفحص الإذن

- `lib/permissions.ts` يصدر `hasPermission(userId, permissionCode)`.
- تبحث في `UserRole` → `AccessRole` → `RolePermission` → `Permission.code`.
- الصفحات تستخدم `hasPermission` قبل عرض الأزرار أو تنفيذ الإجراءات.

### الإدارة من اللوحة

- صفحة `admin/permissions`: عرض وإضافة وتعديل الصلاحيات والأدوار.
- صفحة `admin/users/[id]/permissions`: إسناد أدوار لمستخدم محدد.

---

## ١٠. وحدة Telegram

### الفكرة

بوت Telegram يمكّن ولي الأمر من إدخال بيانات صحية يومية من داخل المحادثة بدون فتح المتصفح.

### المكونات

| المكون | الوظيفة |
|---|---|
| `lib/telegram.ts` | إرسال رسائل، قراءة التوكن، إدارة أكواد الربط |
| `lib/telegram-handler.ts` | معالج الأوامر والرسائل الواردة من Telegram |
| `api/telegram/webhook` | يستقبل التحديثات ويمررها للمعالج |
| `api/telegram/setwebhook` | يطلب من Telegram تسجيل الـ webhook |
| `TelegramChat` | جدول يربط chatId في Telegram بحساب في المنصة |
| `TelegramLinkCode` | رمز مؤقت من 6 أرقام يولده المستخدم في لوحة الإدارة ويدخله في البوت للربط |

### تدفق الربط

```text
1. المستخدم يفتح /admin/telegram في لوحة الإدارة
2. يضغط "توليد رمز ربط" → يُنشئ TelegramLinkCode برقم عشوائي
3. يفتح البوت في Telegram ويرسل: /link 123456
4. البوت يتحقق من الرمز غير منتهي الصلاحية وغير مستخدم
5. يُنشئ TelegramChat يربط chatId بالمستخدم
6. من الآن، أي رسالة من هذا المستخدم تُحلل وتُحفظ
```

### تدفق إدخال الصحة

```text
1. المستخدم يرسل رسالة نصية في البوت: "أحمد نام 8 ساعات ووزنه 13 كجم"
2. Webhook يستقبل التحديث → telegram-handler.ts
3. المعالج يبحث عن المستخدم المرتبط بهذه المحادثة
4. يجلب أول طفل للمستخدم عبر getGuardianChildren
5. يرسل النص إلى askJson لاستخراج بيانات JSON
6. يحفظ النتيجة في جداول الصحة
```

إذا أرسل المستخدم صورة: البوت يحمّلها كـ base64 ويرسلها إلى `askVision` لاستخراج البيانات.

### الأوامر المدعومة

| الأمر | الوصف |
|---|---|
| `/start` | رسالة ترحيب بالبوت |
| `/link <رمز>` | ربط حساب Telegram بحساب المنصة |
| `/health` | عرض ملخص صحي سريع للطفل |
| نص حر | تحليل النص واستخراج بيانات صحية وحفظها |
| صورة | تحليل الصورة واستخراج بيانات صحية وحفظها |

### ملاحظات مهمة

- البوت لا يعمل فعليًا إلا بعد وضع `TELEGRAM_BOT_TOKEN` صحيح في `.env`.
- بعد وضع التوكن، يجب استدعاء `POST /api/telegram/setwebhook` مرة واحدة لتسجيل عنوان الـ webhook مع Telegram.
- صفحة `admin/telegram` تعرض تعليمات الإعداد والمحادثات المرتبطة حاليًا.

---

## ١١. وحدة الترجمة والتدويل

### i18n

- `lib/i18n.ts`: قاموس كبير (مئات المفاتيح) يطابق النص العربي بالإنجليزي والعكس.
- `lib/i18n-server.ts`: يحدد اللغة من الكوكي أو المتصفح في Server Components.
- `language-switcher.tsx`: زر يبدل اللغة ويحفظها في cookie.
- كل نص في الواجهة يُمرر عبر دالة الترجمة `t('المفتاح')`.
- الواجهة RTL بشكل افتراضي (direction: rtl في layout.tsx).

---

## ١٢. وحدة السجلات والمراقبة

### AuditLog

- يسجل كل عملية إدارية مهمة: من فعلها (`actorId`)، ماذا فعل (`action`)، على أي كيان (`entity` + `entityId`).
- صفحة `admin/audit` تعرض السجل.
- يساعد في تتبع التغييرات والمساءلة.

---

## ١٣. كيفية عمل الوحدات معًا — سيناريو يوم في حياة المنصة

### الصباح — ولي الأمر

1. يفتح `parent@test.com` لوحة العائلة `/family`.
2. يشاهد خطة اليوم: "مراجعة الضرب 17:00"، "تقرير الأخصائية 19:00".
3. ينقر على "صحة" بجانب اسم طفله → يرى نموه وتطعيماته وأدويتة.

### الظهر — المدرس

1. يفتح `teacher@test.com` لوحة المدرس `/teacher`.
2. يدخل فصل "رياضيات" ويفتح غرفة الحصة المباشرة.
3. يشرح على السبورة التفاعلية والطلاب يشاهدون.
4. بعد الحصة، ينشئ واجبًا "حل 5 مسائل".

### المساء — الطالب

1. يفتح `student@test.com` لوحة الطالب `/student`.
2. يشاهد الواجب الجديد ويسلّم إجابته.
3. يدفع رسوم الحصة عبر Paymob أو يحوّل للموظف.

### الليل — المشرف

1. يفتح `admin@academy.local` لوحة الإدارة `/admin`.
2. يراجع الحضور والمدفوعات وسجل التدقيق.
3. يُفعّل موديل AI جديد أو يعدل صلاحيات مستخدم.
4. يُولّد رمز ربط Telegram لأحد أولياء الأمور.

### منتصف الليل — التلقائي

1. سكريبت `generate-nursery-invoices.ts` يُنشئ فواتير الحضانة المستحقة.
2. مهمة `backup-db.ps1` المجدولة تنسخ قاعدة البيانات.
3. Telegram bot ينتظر رسائل أولياء الأمور.

---

## ١٤. الجداول المرجعية السريعة

### صفحات كل دور

| الدور | الرابط الرئيسي |
|---|---|
| ADMIN | `/admin` |
| TEACHER | `/teacher` |
| STUDENT | `/student` |
| PARENT | `/parent` أو `/family` |
| STAFF | `/staff` |
| CASHIER | `/cashier` |

### الصلاحيات حسب الوحدة

| الوحدة | صلاحية المشاهدة | صلاحية الإدارة |
|---|---|---|
| لوحة الإدارة | `admin:view` | `admin:users:manage` |
| الأطفال | `children:view` | `children:manage` |
| الفصول | `classes:view` | `classes:manage` |
| المدفوعات | `payments:view` | `payments:manage` |
| الصحة | `health:view` | `health:manage`، `health:documents` |
| الذكاء الاصطناعي | `ai:view` | `ai:manage` |
| الأسرة | `family:view` | `family:manage` |

### API Routes العامة

| المسار | من يستخدمه |
|---|---|
| `api/livekit/token` | live-room.tsx (مدرس + طالب + مشرف) |
| `api/recordings/start|stop` | recording-control.tsx (مدرس) |
| `api/payments/paymob/*` | paymob-checkout.tsx (طالب + ولي أمر) |
| `api/health/documents` | health-upload-form.tsx (أدمن + أخصائي) |
| `api/telegram/webhook` | Telegram servers (خارجي) |
| `api/telegram/setwebhook` | admin/telegram page (أدمن) |
