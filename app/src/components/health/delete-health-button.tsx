"use client";

import { useTransition } from "react";
import {
  deleteGrowthRecord,
  deleteVaccination,
  deleteSleepRecord,
  deleteNutritionRecord,
  deleteMedicine,
  toggleMedicineActive,
  deleteHealthDocument,
} from "@/app/actions/health";

type Kind = "growth" | "vaccination" | "sleep" | "nutrition" | "medicine" | "document";

const actions: Record<Kind, { del: (id: string) => Promise<void>; toggle?: (id: string) => Promise<void> }> = {
  growth: { del: deleteGrowthRecord },
  vaccination: { del: deleteVaccination },
  sleep: { del: deleteSleepRecord },
  nutrition: { del: deleteNutritionRecord },
  medicine: { del: deleteMedicine, toggle: toggleMedicineActive },
  document: { del: deleteHealthDocument },
};

export function DeleteHealthButton({ id, kind, label, active }: { id: string; kind: Kind; label: string; active?: boolean }) {
  const [pending, startTransition] = useTransition();
  const handle = actions[kind];

  function onDelete() {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    startTransition(() => handle.del(id));
  }

  function onToggle() {
    startTransition(() => handle.toggle?.(id));
  }

  return (
    <div className="flex gap-2">
      {handle.toggle && (
        <button onClick={onToggle} disabled={pending} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
          {active ? "إيقاف" : "استئناف"}
        </button>
      )}
      <button onClick={onDelete} disabled={pending} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
        {pending ? "..." : label}
      </button>
    </div>
  );
}
