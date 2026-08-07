"use client";

import { useEffect, useState } from "react";
import { LOCALE_COOKIE, messages, type Locale } from "@/lib/i18n";

function translatePage(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  if (locale === "ar") return;

  const translate = (value: string) => Object.entries(messages)
    .filter(([arabic]) => arabic.length >= 3)
    .sort(([a], [b]) => b.length - a.length)
    .reduce((result, [arabic, english]) => result.replaceAll(arabic, english), value);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const value = node.nodeValue?.trim();
    if (value) {
      const translated = translate(node.nodeValue ?? "");
      if (translated !== node.nodeValue) node.nodeValue = translated;
    }
  }
  document.querySelectorAll<HTMLElement>("[placeholder], [aria-label]").forEach((element) => {
    for (const attribute of ["placeholder", "aria-label"] as const) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translate(value));
    }
  });
}

export function LanguageSwitcher({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    translatePage(initialLocale);
    if (initialLocale === "ar") return;
    const observer = new MutationObserver(() => translatePage(initialLocale));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [initialLocale]);

  function changeLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setLocale(next);
    translatePage(next);
    window.location.reload();
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex overflow-hidden rounded-full border border-slate-200 bg-white/90 text-xs font-bold shadow-lg backdrop-blur">
      <button type="button" onClick={() => changeLocale("ar")} aria-pressed={locale === "ar"} className={`px-3.5 py-2 transition ${locale === "ar" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>العربية</button>
      <button type="button" onClick={() => changeLocale("en")} aria-pressed={locale === "en"} className={`px-3.5 py-2 transition ${locale === "en" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>English</button>
    </div>
  );
}
