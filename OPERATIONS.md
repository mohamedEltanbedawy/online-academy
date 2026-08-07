# تشغيل المنصة محليًا

## الخدمات

```powershell
docker compose up -d
docker compose ps
```

الخدمات المطلوبة: PostgreSQL وRedis وLiveKit وLiveKit Egress.

## التطبيق

```powershell
cd app
npm run dev
```

## النسخ الاحتياطي

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-db.ps1
```

لا ترفع مجلد `backups` إلى GitHub. قبل استعادة نسخة، أوقف التطبيق وتأكد أن النسخة تخص نفس إصدار قاعدة البيانات.

## توليد فواتير الحضانة

```powershell
cd app
npm run billing:generate
```

في الإنتاج يُشغّل الأمر مرة يوميًا بواسطة Cron أو Task Scheduler.

## الجدولة على Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register-scheduled-tasks.ps1
```

الفحص الصحي:

```text
http://localhost:3000/api/health
```

## النشر لاحقًا

- دومين HTTPS للتطبيق وLiveKit.
- `LIVEKIT_URL` يتحول إلى `wss://...` في الإنتاج.
- TURN/TLS مع شهادة صحيحة.
- مفاتيح Paymob الحقيقية في متغيرات البيئة فقط.
- نسخ احتياطي خارج نفس السيرفر.
