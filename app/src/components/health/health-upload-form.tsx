"use client";

import { useState } from "react";

export function HealthUploadForm({ childId }: { childId: string }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file") as File;
    if (!file || file.size === 0) {
      setMessage("اختر ملف أولًا.");
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/health/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الرفع");
      setMessage("تم رفع الملف بنجاح.");
      form.reset();
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="childId" value={childId} />
      {message && <p className={`rounded-lg p-3 text-sm ${message.startsWith("تم") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">العنوان (اختياري)</label>
        <input id="title" name="title" placeholder="مثال: شهادة تطعيم الدرن" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">النوع</label>
        <select id="category" name="category" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500">
          <option value="تقرير طبي">تقرير طبي</option>
          <option value="شهادة تطعيم">شهادة تطعيم</option>
          <option value="وصفة">وصفة</option>
          <option value="أخرى">أخرى</option>
        </select>
      </div>
      <div>
        <label htmlFor="file" className="mb-1 block text-sm font-medium text-slate-700">الملف (صورة/PDF — حتى 15MB)</label>
        <input id="file" name="file" type="file" required accept="image/*,.pdf,.doc,.docx" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
      </div>
      <button type="submit" disabled={uploading} className="btn-primary">{uploading ? "جاري الرفع..." : "رفع الملف"}</button>
    </form>
  );
}
