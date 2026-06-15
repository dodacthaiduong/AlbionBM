"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type NavKey = "home" | "about" | "tours" | "services" | "events" | "careers" | "contact";

const NAV_ITEMS: ReadonlyArray<{ key: NavKey; href: "/" | "/gioi-thieu" | "/tour-du-lich" | "/dich-vu-du-lich" | "/to-chuc-su-kien" | "/tuyen-dung" | "/lien-he" }> = [
  { key: "home", href: "/" },
  { key: "about", href: "/gioi-thieu" },
  { key: "tours", href: "/tour-du-lich" },
  { key: "services", href: "/dich-vu-du-lich" },
  { key: "events", href: "/to-chuc-su-kien" },
  { key: "careers", href: "/tuyen-dung" },
  { key: "contact", href: "/lien-he" },
] as const;

export default function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY >= 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function switchLocale(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/setting")) return null;

  const headerClass = [
    "fixed top-0 left-0 z-[100] w-full text-white transition-all duration-300",
    scrolled
      ? "bg-[rgba(15,30,60,0.97)] backdrop-blur-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
      : "bg-[rgba(15,30,60,0.45)] backdrop-blur-[4px]",
  ].join(" ");

  const textShadowStyle = { textShadow: "0 1px 3px rgba(0,0,0,0.5)" };
  const flagBorder = "border-white/40 hover:border-[#F5C518]";
  const hamburgerClass = "text-white hover:bg-white/10";
  const mobilePanelClass = scrolled
    ? "bg-[rgba(15,30,60,0.97)] border-white/10 backdrop-blur-[8px]"
    : "bg-[rgba(15,30,60,0.6)] border-white/10 backdrop-blur-md";
  const mobileDivider = "border-white/10";

  return (
    <header className={headerClass}>
      <nav
        aria-label={t("ariaPrimary")}
        className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-10"
      >
        {/* Logo */}
        <Link
          href="/"
          locale={locale}
          className="flex items-center gap-3"
          aria-label={t("logoAria")}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </span>
          <span
            className="font-serif text-xl font-extrabold tracking-wide text-white transition-colors duration-300"
            style={textShadowStyle}
          >
            FORCO
          </span>
        </Link>

        {/* Desktop menu */}
        <ul className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              (item.href === "/" && pathname === "/") ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  locale={locale}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-block border-b-2 px-4 py-2 text-[15px] font-medium text-white transition-colors duration-200",
                    isActive
                      ? "border-[#F5C518] text-[#F5C518]"
                      : "border-transparent hover:border-[#F5C518] hover:text-[#F5C518]",
                  ].join(" ")}
                  style={textShadowStyle}
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Language flags (desktop) */}
        <div className="hidden items-center gap-2 lg:flex">
          {routing.locales.map((loc) => {
            const active = loc === locale;
            const flag = loc === "vi" ? "🇻🇳" : "🇬🇧";
            const label = loc === "vi" ? t("langVi") : t("langEn");
            return (
              <button
                key={loc}
                type="button"
                aria-label={label}
                aria-pressed={active}
                onClick={() => switchLocale(loc)}
                disabled={isPending}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border text-base transition hover:scale-105",
                  active
                    ? "border-[#F5C518] ring-2 ring-[#F5C518]/40"
                    : flagBorder,
                ].join(" ")}
              >
                {flag}
              </button>
            );
          })}
        </div>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className={[
            "flex h-10 w-10 items-center justify-center rounded-md transition-colors lg:hidden",
            hamburgerClass,
          ].join(" ")}
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={[
          "overflow-hidden border-t transition-all duration-300 lg:hidden",
          mobilePanelClass,
          open ? "max-h-[600px]" : "max-h-0",
        ].join(" ")}
      >
        <ul className="flex flex-col px-6 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              (item.href === "/" && pathname === "/") ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  locale={locale}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "block border-l-[3px] py-3 pl-4 text-[15px] font-medium text-white transition-colors",
                    isActive
                      ? "border-[#F5C518] text-[#F5C518]"
                      : "border-transparent hover:border-[#F5C518] hover:text-[#F5C518]",
                  ].join(" ")}
                  style={textShadowStyle}
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
        <div
          className={[
            "flex items-center gap-2 border-t px-6 py-4",
            mobileDivider,
          ].join(" ")}
        >
          {routing.locales.map((loc) => {
            const active = loc === locale;
            const flag = loc === "vi" ? "🇻🇳" : "🇬🇧";
            const label = loc === "vi" ? t("langVi") : t("langEn");
            return (
              <button
                key={loc}
                type="button"
                aria-label={label}
                aria-pressed={active}
                onClick={() => {
                  setOpen(false);
                  switchLocale(loc);
                }}
                disabled={isPending}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border text-base",
                  active
                    ? "border-[#F5C518] ring-2 ring-[#F5C518]/40"
                    : flagBorder,
                ].join(" ")}
              >
                {flag}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
