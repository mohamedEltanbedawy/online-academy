import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

// طبقة الـ AI الموحدة — بتقرأ موديل "الافتراضي" من قاعدة البيانات
// وبتكلم أي مزود بنفس الطريقة: GEMINI / OPENAI / OLLAMA
// (كل إعدادات الموديلات بتتدار من لوحة الإدارة → AiProvider)

type ProviderType = "GEMINI" | "OPENAI" | "OLLAMA";

export interface ActiveProvider {
  id: string;
  name: string;
  provider: ProviderType;
  modelName: string;
  baseUrl: string | null;
  apiKey: string | null;
  supportsVision: boolean;
  temperature: number | null;
  maxTokens: number | null;
}

// الموديل الافتراضي النشط (cached داخل الطلب الواحد)
export const getActiveProvider = cache(async (): Promise<ActiveProvider | null> => {
  const provider = await prisma.aiProvider.findFirst({
    where: { isDefault: true, enabled: true },
  });
  if (!provider) return null;
  return {
    id: provider.id,
    name: provider.name,
    provider: provider.provider,
    modelName: provider.modelName,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    supportsVision: provider.supportsVision,
    temperature: provider.temperature,
    maxTokens: provider.maxTokens,
  };
});

// طلب نص → نص (بدون صورة) — أسهل طريقة لأي مزود
export async function askText(prompt: string, system?: string): Promise<string> {
  const provider = await getActiveProvider();
  if (!provider) throw new Error("لا يوجد موديل AI مفعل — أضف موديل من لوحة الإدارة");
  return provider.provider === "GEMINI"
    ? geminiText(provider, prompt, system)
    : provider.provider === "OPENAI"
      ? openaiText(provider, prompt, system)
      : ollamaText(provider, prompt, system);
}

// طلب JSON بنمط محدد (بيتأكد إن الرد JSON صالح)
export async function askJson<T>(prompt: string, system?: string): Promise<T> {
  const raw = await askText(prompt, system);
  const cleaned = extractJson(raw);
  return JSON.parse(cleaned) as T;
}

// طلب مع صورة (مشفرة base64) — للملفات والورق والصور الطبية
export async function askVision(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
  const provider = await getActiveProvider();
  if (!provider) throw new Error("لا يوجد موديل AI مفعل — أضف موديل من لوحة الإدارة");
  if (!provider.supportsVision) throw new Error("الموديل الحالي لا يدعم الصور — اختر موديل يدعم الرؤية من لوحة الإدارة");
  return provider.provider === "GEMINI"
    ? geminiVision(provider, prompt, imageBase64, mimeType)
    : provider.provider === "OPENAI"
      ? openaiVision(provider, prompt, imageBase64, mimeType)
      : ollamaText(provider, prompt, undefined);
}

// استخراج JSON من رد قد يكون فيه كلام زيادة
function extractJson(raw: string): string {
  const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  const arrStart = raw.indexOf("[");
  const arrEnd = raw.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) return raw.slice(arrStart, arrEnd + 1);
  return raw;
}

// ============ GEMINI ============
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

async function geminiBody(prompt: string, system?: string, imageBase64?: string, mimeType?: string) {
  const contents: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[] = [];
  if (system) {
    contents.push({ role: "user", parts: [{ text: `التعليمات: ${system}` }] });
    contents.push({ role: "model", parts: [{ text: "تمام." }] });
  }
  const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
  if (imageBase64 && mimeType) userParts.push({ inlineData: { mimeType, data: imageBase64 } });
  userParts.push({ text: prompt });
  contents.push({ role: "user", parts: userParts });
  return {
    contents,
    generationConfig: { responseMimeType: "application/json" },
  };
}

async function geminiText(provider: ActiveProvider, prompt: string, system?: string): Promise<string> {
  const key = provider.apiKey;
  if (!key) throw new Error("موديل Gemini مفقود المفتاح — أضف المفتاح من لوحة الإدارة");
  const body = await geminiBody(prompt, system);
  const res = await fetch(`${GEMINI_URL}/${provider.modelName}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`فشل اتصال Gemini: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("رد Gemini فارغ");
  return text;
}

async function geminiVision(provider: ActiveProvider, prompt: string, imageBase64: string, mimeType: string): Promise<string> {
  const key = provider.apiKey;
  if (!key) throw new Error("موديل Gemini مفقود المفتاح — أضف المفتاح من لوحة الإدارة");
  const body = await geminiBody(prompt, undefined, imageBase64, mimeType);
  const res = await fetch(`${GEMINI_URL}/${provider.modelName}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`فشل اتصال Gemini: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("رد Gemini فارغ");
  return text;
}

// ============ OPENAI ============
async function openaiText(provider: ActiveProvider, prompt: string, system?: string): Promise<string> {
  const key = provider.apiKey;
  if (!key) throw new Error("موديل OpenAI مفقود المفتاح — أضف المفتاح من لوحة الإدارة");
  const messages = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    { role: "user" as const, content: prompt },
  ];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: provider.modelName,
      messages,
      temperature: provider.temperature ?? 0.2,
      max_tokens: provider.maxTokens ?? 1024,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`فشل اتصال OpenAI: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("رد OpenAI فارغ");
  return text;
}

async function openaiVision(provider: ActiveProvider, prompt: string, imageBase64: string, mimeType: string): Promise<string> {
  const key = provider.apiKey;
  if (!key) throw new Error("موديل OpenAI مفقود المفتاح — أضف المفتاح من لوحة الإدارة");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: provider.modelName,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
      temperature: provider.temperature ?? 0.2,
      max_tokens: provider.maxTokens ?? 1024,
    }),
  });
  if (!res.ok) throw new Error(`فشل اتصال OpenAI: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("رد OpenAI فارغ");
  return text;
}

// ============ OLLAMA (محلي) ============
async function ollamaText(provider: ActiveProvider, prompt: string, system?: string): Promise<string> {
  const base = provider.baseUrl ?? "http://localhost:11434";
  const messages = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    { role: "user" as const, content: prompt },
  ];
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: provider.modelName, messages, stream: false }),
  });
  if (!res.ok) throw new Error(`فشل اتصال Ollama: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data?.message?.content ?? "";
  if (!text) throw new Error("رد Ollama فارغ");
  return text;
}
