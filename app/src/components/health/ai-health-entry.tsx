"use client";

import { useState } from "react";
import { parseHealthText, parseHealthImage, saveParsedHealth } from "@/app/actions/health-ai";

type HealthData = {
  growth: { date: string; weightKg?: number | null; heightCm?: number | null; headCm?: number | null; notes?: string | null }[];
  vaccinations: { name: string; dose?: string | null; date: string; nextDueDate?: string | null; notes?: string | null }[];
  sleep: { date: string; hours?: number | null; quality?: string | null; notes?: string | null }[];
  nutrition: { date: string; meal?: string | null; foods: string; notes?: string | null }[];
  medicines: { name: string; dosage?: string | null; frequency?: string | null; startDate?: string | null; endDate?: string | null; notes?: string | null }[];
};

export function AiHealthEntry({ childId }: { childId: string }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [data, setData] = useState<HealthData | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleParse() {
    setError(null);
    setMessage(null);
    if (image) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = String(reader.result).split(",")[1];
        const res = await parseHealthImage(childId, base64, image.type || "image/jpeg");
        apply(res);
      };
      reader.readAsDataURL(image);
      return;
    }
    const res = await parseHealthText(childId, text);
    apply(res);
  }

  function apply(res: { data?: HealthData; model?: string; error?: string }) {
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setData(null);
      return;
    }
    if (res.data) {
      setData(res.data);
      setModel(res.model ?? null);
      const total = res.data.growth.length + res.data.vaccinations.length + res.data.sleep.length + res.data.nutrition.length + res.data.medicines.length;
      setMessage(`تم استخراج ${total} سجل بنجاح — راجعهم قبل الحفظ.`);
    }
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setError(null);
    const res = await saveParsedHealth(childId, data);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const c = res.counts!;
    setMessage(`تم الحفظ: ${c.growth} نمو، ${c.vaccinations} تطعيم، ${c.sleep} نوم، ${c.nutrition} غذاء، ${c.medicines} دواء.`);
    setData(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-2 text-sm font-bold text-slate-700">الصق النص أو ارفع صورة (شهادة/ورق)</h3>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="مثال: قياس اليوم وزن 12.5 وطول 95، وتطعيم ثلاثي بكتيري جرعة ثانية بتاريخ 2026-08-01..." className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" disabled={loading} />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" disabled={loading} />
        <button onClick={handleParse} disabled={loading || (!text.trim() && !image)} className="btn-primary mt-3">
          {loading ? "جاري القراءة بالذكاء الاصطناعي..." : "استخراج البيانات بالذكاء الاصطناعي"}
        </button>
        {model && <p className="mt-2 text-xs text-slate-500">الموديل المستخدم: {model}</p>}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}

      {data && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-700">معاينة قبل الحفظ</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewCard title={`النمو (${data.growth.length})`}>
              {data.growth.map((g, i) => <p key={i} className="text-sm">{g.date} — وزن {g.weightKg ?? "-"} طول {g.heightCm ?? "-"}</p>)}
            </PreviewCard>
            <PreviewCard title={`التطعيمات (${data.vaccinations.length})`}>
              {data.vaccinations.map((v, i) => <p key={i} className="text-sm">{v.name} — {v.date}</p>)}
            </PreviewCard>
            <PreviewCard title={`النوم (${data.sleep.length})`}>
              {data.sleep.map((s, i) => <p key={i} className="text-sm">{s.date} — {s.hours ?? "-"} ساعات</p>)}
            </PreviewCard>
            <PreviewCard title={`الغذاء (${data.nutrition.length})`}>
              {data.nutrition.map((n, i) => <p key={i} className="text-sm">{n.date} — {n.foods}</p>)}
            </PreviewCard>
            <PreviewCard title={`الأدوية (${data.medicines.length})`}>
              {data.medicines.map((m, i) => <p key={i} className="text-sm">{m.name} — {m.dosage ?? "-"}</p>)}
            </PreviewCard>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary mt-4">{saving ? "جاري الحفظ..." : "حفظ البيانات في الملف الصحي"}</button>
        </div>
      )}
    </div>
  );
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="mb-2 text-sm font-bold text-slate-700">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
