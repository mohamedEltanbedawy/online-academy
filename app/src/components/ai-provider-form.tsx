"use client";

import { useActionState } from "react";
import { saveAiProvider, type AiActionState } from "@/app/actions/ai";

const providerOptions = [
  { value: "GEMINI", label: "Gemini (Google)" },
  { value: "OPENAI", label: "OpenAI" },
  { value: "OLLAMA", label: "Ollama محلي" },
];

type Provider = {
  id: string;
  name: string;
  provider: "GEMINI" | "OPENAI" | "OLLAMA";
  modelName: string;
  baseUrl: string | null;
  apiKey: string | null;
  supportsVision: boolean;
  enabled: boolean;
  isDefault: boolean;
  temperature: number | null;
  maxTokens: number | null;
};

export function AiProviderForm({ provider }: { provider?: Provider }) {
  const [state, action, pending] = useActionState<AiActionState, FormData>(saveAiProvider, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
      {provider?.id && <input type="hidden" name="id" value={provider.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">اسم الموديل</label>
          <input id="name" name="name" required defaultValue={provider?.name} placeholder="مثال: Gemini Flash" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {state?.errors?.name && <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>}
        </div>
        <div>
          <label htmlFor="provider" className="mb-1 block text-sm font-medium text-slate-700">المزود</label>
          <select id="provider" name="provider" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500">
            {providerOptions.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="modelName" className="mb-1 block text-sm font-medium text-slate-700">اسم الموديل التقني</label>
          <input id="modelName" name="modelName" required defaultValue={provider?.modelName} placeholder="مثال: gemini-2.5-flash" dir="ltr" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {state?.errors?.modelName && <p className="mt-1 text-sm text-red-600">{state.errors.modelName[0]}</p>}
        </div>
        <div>
          <label htmlFor="baseUrl" className="mb-1 block text-sm font-medium text-slate-700">الرابط (للمحلي فقط)</label>
          <input id="baseUrl" name="baseUrl" defaultValue={provider?.baseUrl ?? ""} placeholder="http://localhost:11434" dir="ltr" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="apiKey" className="mb-1 block text-sm font-medium text-slate-700">مفتاح API</label>
          <input id="apiKey" name="apiKey" type="password" defaultValue={provider?.apiKey ?? ""} placeholder="يُحفظ في قاعدة البيانات (لا يُرفع على GitHub)" dir="ltr" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          {provider?.apiKey && <p className="mt-1 text-xs text-slate-500">مفتاح محفوظ مسبقًا — اتركه كما هو لو مش عايز تغيّره.</p>}
        </div>
        <div>
          <label htmlFor="temperature" className="mb-1 block text-sm font-medium text-slate-700">درجة الإبداع (اختياري)</label>
          <input id="temperature" name="temperature" type="number" step="0.1" defaultValue={provider?.temperature ?? 0.2} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="maxTokens" className="mb-1 block text-sm font-medium text-slate-700">أقصى عدد رموز (اختياري)</label>
          <input id="maxTokens" name="maxTokens" type="number" defaultValue={provider?.maxTokens ?? 1024} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="supportsVision" defaultChecked={provider?.supportsVision ?? false} className="size-4" />
          <span className="text-slate-700">يدعم فهم الصور والورق</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="enabled" defaultChecked={provider?.enabled ?? true} className="size-4" />
          <span className="text-slate-700">نشط</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isDefault" defaultChecked={provider?.isDefault ?? false} className="size-4" />
          <span className="text-slate-700">افتراضي للنظام كله</span>
        </label>
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "جاري الحفظ..." : provider ? "حفظ التعديلات" : "إضافة الموديل"}</button>
    </form>
  );
}
