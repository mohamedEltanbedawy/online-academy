// أدوات تنسيق العرض (الفلوس والأيام)

// عرض مبلغ بالجنيه بدقة (مثال: ١٢٣.٥٠ بدل أرقام عائمة)
export function formatMoney(value: number | { toNumber?: () => number }): string {
  const n = typeof value === "number" ? value : (value.toNumber?.() ?? 0);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// أسماء الأيام بالعربي بنفس ترتيب getDay في JavaScript (0=الأحد ... 6=السبت)
export const DAY_LABELS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export function dayLabel(day: number): string {
  return DAY_LABELS[day] ?? "";
}
