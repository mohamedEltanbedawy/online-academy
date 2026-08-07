"use client";

import { useState } from "react";

export function RecordingControl({ classId }: { classId: string }) {
  const [recordingId, setRecordingId] = useState("");
  const [title, setTitle] = useState("تسجيل الحصة");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function start() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/recordings/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, title }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر بدء التسجيل");
      setRecordingId(data.recordingId);
      setMessage("التسجيل يعمل الآن");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر بدء التسجيل");
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/recordings/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordingId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر إيقاف التسجيل");
      setRecordingId("");
      setMessage("تم حفظ التسجيل");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إيقاف التسجيل");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!recordingId && <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500" placeholder="اسم التسجيل" />}
      {recordingId ? <button type="button" onClick={() => void stop()} disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">{busy ? "..." : "إيقاف التسجيل"}</button> : <button type="button" onClick={() => void start()} disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">{busy ? "..." : "بدء التسجيل"}</button>}
      {message && <span className="text-xs text-slate-500">{message}</span>}
    </div>
  );
}
