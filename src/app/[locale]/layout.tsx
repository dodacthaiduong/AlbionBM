import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Merriweather, Open_Sans } from "next/font/google";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import "./globals.css";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700", "900"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: "Forco Travel & Event",
    description: t("home"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${merriweather.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Navbar locale={locale} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
