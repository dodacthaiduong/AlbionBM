"use client";

import type { CSSProperties } from "react";
import { Nunito } from "next/font/google";
import { Link, usePathname } from "@/i18n/navigation";
import type { LogoStyle, Settings } from "@/lib/settings-types";

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-nunito",
  display: "swap",
});

const FOOTER_SERVICES_LIMIT = 6;
const FOOTER_HOTLINE_LIMIT = 4;

function getLogoBoxStyle(style: LogoStyle): CSSProperties {
  const base: CSSProperties = {
    width: style.width,
    height: style.height,
  };
  if (style.mode === "full") return base;
  if (style.mode === "cover") {
    return { ...base, borderRadius: style.radius, overflow: "hidden" };
  }
  return {
    ...base,
    borderRadius: style.radius,
    background: style.bg ?? "transparent",
    padding: style.padding,
    overflow: "hidden",
  };
}

function getLogoImgStyle(style: LogoStyle): CSSProperties {
  return { width: "100%", height: "100%", objectFit: style.objectFit };
}

function hrefFor(item: { href: string }): "/tour-du-lich" | "/to-chuc-su-kien" | "/dich-vu-du-lich" | "/gioi-thieu" | "/lien-he" | "/" {
  const h = item.href;
  if (h === "/tour-du-lich" || h === "/to-chuc-su-kien" || h === "/dich-vu-du-lich" || h === "/gioi-thieu" || h === "/lien-he" || h === "/") {
    return h;
  }
  return "/";
}

export default function Footer({ settings }: { settings: Settings }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/setting")) {
    return null;
  }
  const { company, services, quickLinks } = settings;
  return (
    <footer
      className={`${nunito.variable} mt-auto w-full bg-[#1e3a5f] text-[#94a3b8]`}
      style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 py-12 md:px-10 md:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="flex flex-col items-start gap-3 lg:border-r lg:border-white/10 lg:pr-8">
            <Link
              href="/"
              aria-label={`${company.name} - Trang chủ`}
              className="inline-block"
              style={getLogoBoxStyle(company.logoStyle)}
            >
              {company.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  style={getLogoImgStyle(company.logoStyle)}
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex items-center justify-center text-xl font-bold text-white"
                  style={{ width: "100%", height: "100%" }}
                >
                  {company.shortName.slice(0, 1) || "F"}
                </div>
              )}
            </Link>
            <span className="text-base font-bold uppercase tracking-wide text-white">
              {company.name}
            </span>
          </div>

          <div className="lg:border-r lg:border-white/10 lg:pr-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              {company.name}
            </h3>
            <ul className="space-y-2 text-sm leading-relaxed">
              {company.hq && (
                <li>
                  <span className="font-semibold text-white">Trụ sở:</span>{" "}
                  <span>{company.hq.replace(/^Trụ sở:\s*/i, "")}</span>
                </li>
              )}
              {company.office && (
                <li>
                  <span className="font-semibold text-white">VPGD:</span>{" "}
                  <span>{company.office.replace(/^VPGD:\s*/i, "")}</span>
                </li>
              )}
              {company.websiteLabel && company.websiteUrl && (
                <li>
                  <span className="font-semibold text-white">Website:</span>{" "}
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white transition-colors duration-200 hover:text-[#f59e0b] hover:underline"
                  >
                    {company.websiteLabel}
                  </a>
                </li>
              )}
              {company.fanpageLabel && company.fanpageUrl && (
                <li>
                  <span className="font-semibold text-white">Fanpage:</span>{" "}
                  <a
                    href={company.fanpageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white transition-colors duration-200 hover:text-[#f59e0b] hover:underline"
                  >
                    {company.fanpageLabel}
                  </a>
                </li>
              )}
              {company.hotlines.length > 0 && (
                <li>
                  <span className="font-semibold text-white">Hotline:</span>{" "}
                  {company.hotlines.slice(0, FOOTER_HOTLINE_LIMIT).map((h, i) => (
                    <span key={h.id}>
                      <a
                        href={`tel:${h.number.replace(/[^0-9+]/g, "")}`}
                        className="text-white transition-colors duration-200 hover:text-[#f59e0b] hover:underline"
                      >
                        {h.number}
                      </a>
                      {i < Math.min(company.hotlines.length, FOOTER_HOTLINE_LIMIT) - 1 && (
                        <span> – </span>
                      )}
                    </span>
                  ))}
                </li>
              )}
              {company.email && (
                <li>
                  <span className="font-semibold text-white">Email:</span>{" "}
                  <a
                    href={`mailto:${company.email}`}
                    className="text-white transition-colors duration-200 hover:text-[#f59e0b] hover:underline"
                  >
                    {company.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="lg:border-r lg:border-white/10 lg:pr-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Dịch vụ của chúng tôi
            </h3>
            <ul className="space-y-2 text-sm">
              {services.slice(0, FOOTER_SERVICES_LIMIT).map((s) => (
                <li key={s.id}>
                  <Link
                    href={hrefFor(s)}
                    className="text-white transition-colors duration-200 hover:text-[#f59e0b] hover:underline"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Thông tin
            </h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((q) => (
                <li key={q.id}>
                  <Link
                    href={hrefFor(q)}
                    className="text-white transition-colors duration-200 hover:text-[#f59e0b] hover:underline"
                  >
                    {q.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center text-xs text-[#94a3b8] md:px-10">
          © {new Date().getFullYear()} {company.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
