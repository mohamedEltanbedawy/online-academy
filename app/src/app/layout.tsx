import type { Metadata } from "next";
import "./globals.css";
import "tldraw/tldraw.css";
import { localeAttributes } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata: Metadata = {
  title: "منصة الدروس الخصوصية",
  description: "منصة وسيط بين المدرسين والطلبة — حصص مباشرة وواجبات وحصص مسجلة",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const attributes = localeAttributes(locale);
  return (
    <html
      lang={attributes.lang}
      dir={attributes.dir}
      className="h-full antialiased"
    >
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <LanguageSwitcher initialLocale={locale} />
      </body>
    </html>
  );
}
