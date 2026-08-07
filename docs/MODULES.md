# خريطة الوحدات — Family OS
### Modules — خريطة المنظومة الكاملة

## ١) الوحدات الحالية (شغالة ✅)

| الوحدة | الحالة | الملفات الرئيسية |
|---|---|---|
| الدروس الخصوصية (LiveKit) | ✅ | `src/components/live-room.tsx`, `api/livekit/*` |
| الواجبات والتسليم | ✅ | `src/components/teacher/create-homework-form.tsx` |
| التسجيلات والمكتبة | ✅ | `api/recordings/*` |
| الدفع (منفذ بيع + Paymob) | ✅ | `src/lib/paymob.ts`, `api/payments/*` |
| سجلات الأطفال والحضانة | ✅ | `src/app/actions/children.ts`, `academy.ts` |
| المراحل والبرامج والمهارات | ✅ | `src/app/actions/academy.ts` |
| الأنشطة والحضور | ✅ | `src/app/actions/activities.ts` |
| اشتراك الحضانة والفواتير | ✅ | `src/app/actions/billing.ts` |
| لوحة التحكم الموحدة + AuditLog | ✅ | `src/app/admin/*` |
| **عزل المستأجرين (M1)** | ✅ | `src/lib/tenant.ts`, `prisma/backfill-m1.ts` |
| **لوحة الأسرة + التقويم + الخطة اليومية (M2)** | ✅ | `src/app/family/*`, `src/lib/family.ts`, `src/app/actions/family.ts` |
| **الصحة (M3)** — نمو/تطعيم/نوم/غذاء/أدوية/ملفات/PDF | ✅ | `src/lib/health.ts`, `src/app/actions/health.ts`, `src/app/admin/children/[id]/health/*`, `src/app/family/health/*` |
| **إدارة مقدمي الـ AI (M3.5)** | ✅ | `src/lib/ai.ts`, `src/app/admin/ai/*`, `src/app/actions/ai.ts` |
| **الصلاحيات الدقيقة RBAC (M3.5)** | ✅ | `src/lib/permissions.ts`, `src/app/admin/permissions/*`, `src/app/admin/users/[id]/permissions/*` |
| **دخول البيانات بالذكاء الاصطناعي (نص/صورة/ورق)** | ✅ | `src/lib/health-save.ts`, `src/app/actions/health-ai.ts`, `src/app/admin/children/[id]/health/ai/*` |
| **بوت تيليجرام (M3.5)** | ✅ (ينتظر توكن `TELEGRAM_BOT_TOKEN`) | `src/lib/telegram.ts`, `src/lib/telegram-handler.ts`, `src/app/api/telegram/*`, `src/app/admin/telegram/*` |

## ٢) الوحدات الجديدة (مخطط لها بالترتيب)

| الأولوية | الوحدة | ماذا تعطي للعائلة؟ |
|---|---|---|
| 1 | **لوحة الأسرة + التقويم + الخطة اليومية** | شاشة واحدة فيها كل حاجة العائلة: الجدول، المهام، الخطة ✅ تم |
| 2 | **الصحة (Health)** | نمو/وزن/طول، تطعيمات، نوم، غذاء، أدوية، ملفات، تصدير PDF ✅ تم |
| 3 | **المساعد الذكي (AI Assistant)** | إدخال البيانات تلقائيًا من نص/صورة/ورق + توصيات ✅ تم (أساس الدخول) |
| 4 | **ذاكرة العائلة + الإنجازات + أحداث الحياة** | توثيق الذكريات والإنجازات |
| 5 | **المخطط الذكي + العادات** | خطط يومية + عادات متابعة |
| 6 | **الروبوت (Telegram Bot)** | ربط الحسابات + إدخال صحي عبر المحادثة ✅ تم (بانتظار التوكن) |
| 7 | **شبكة المعرفة (Knowledge Graph)** | استخراج العلاقات آليًا + تعديل يدوي |

## ٣) التكامل بين الوحدات

- **Person** هو العمود الفقري: كل طفل/ولي/مدرس في كل الوحدات هو Person أولًا.
- **Tenant** يضم كل الوحدات لمستأجر واحد — التعليم والصحة والذاكرة لعائلة واحدة في مكان واحد.
- **الـ AI** يقرأ فوق الوحدات كلها ليعمل التوصيات والخطط.
- **Telegram** هو النافذة اليومية (يسأل ويرد ويبعت).

## ٤) التجربة (Pilot)

- العدد الأول: **3–7 عائلات** حقيقية.
- اللغات: **عربي + إنجليزي** من اليوم الأول.
- المعيار: العائلة تستخدم لوحة الأسرة + الروبوت يوميًا.
