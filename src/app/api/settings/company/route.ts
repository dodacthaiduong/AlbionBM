import { updateCompany } from '@/lib/settings';
import type { Company, Hotline, LogoMode, LogoObjectFit, LogoStyle } from '@/lib/settings-types';
import {
    cleanHref,
    cleanText,
    isHttpUrl,
    isObject,
    isString,
    jsonError,
    jsonOk,
    requireAuth,
} from '@/lib/api';

export const dynamic = 'force-dynamic';

function validateHotline(raw: unknown): Hotline | null {
    if (!isObject(raw)) return null;
    if (!isString(raw.id) || !raw.id) return null;
    const label = isString(raw.label) ? cleanText(raw.label) : '';
    const number = isString(raw.number) ? cleanText(raw.number) : '';
    if (!label || !number) return null;
    return { id: raw.id, label, number };
}

const LOGO_MODES: LogoMode[] = ['contained', 'full', 'cover'];
const LOGO_OBJECT_FITS: LogoObjectFit[] = [
    'contain',
    'cover',
    'fill',
    'none',
    'scale-down',
];

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    const n = Math.round(value);
    if (n < min) return min;
    if (n > max) return max;
    return n;
}

function validateLogoStyle(raw: unknown, base: LogoStyle): LogoStyle {
    if (!isObject(raw)) return base;
    const mode = isString(raw.mode) && (LOGO_MODES as string[]).includes(raw.mode)
        ? (raw.mode as LogoMode)
        : base.mode;
    const width = clampNumber(raw.width, 8, 512, base.width);
    const height = clampNumber(raw.height, 8, 512, base.height);
    const radius = clampNumber(raw.radius, 0, 256, base.radius);
    const padding = clampNumber(raw.padding, 0, 256, base.padding);
    const objectFit =
        isString(raw.objectFit) && (LOGO_OBJECT_FITS as string[]).includes(raw.objectFit)
            ? (raw.objectFit as LogoObjectFit)
            : base.objectFit;
    const bg = isString(raw.bg) ? cleanText(raw.bg) : base.bg;
    return { mode, width, height, radius, padding, objectFit, bg };
}

function validateCompany(raw: unknown): Company | null {
    if (!isObject(raw)) return null;
    const logo = isString(raw.logo) ? cleanText(raw.logo) : '';
    const name = isString(raw.name) ? cleanText(raw.name) : '';
    const shortName = isString(raw.shortName) ? cleanText(raw.shortName) : '';
    const hq = isString(raw.hq) ? cleanText(raw.hq) : '';
    const office = isString(raw.office) ? cleanText(raw.office) : '';
    const websiteLabel = isString(raw.websiteLabel)
        ? cleanText(raw.websiteLabel)
        : '';
    const websiteUrl = isString(raw.websiteUrl)
        ? cleanHref(raw.websiteUrl)
        : '';
    const fanpageLabel = isString(raw.fanpageLabel)
        ? cleanText(raw.fanpageLabel)
        : '';
    const fanpageUrl = isString(raw.fanpageUrl)
        ? cleanHref(raw.fanpageUrl)
        : '';
    const email = isString(raw.email) ? cleanText(raw.email) : '';

    if (!name) return null;
    if (!shortName) return null;
    if (!hq || !office) return null;
    if (!websiteLabel || !websiteUrl) return null;
    if (!isHttpUrl(websiteUrl)) return null;
    if (!fanpageLabel || !fanpageUrl) return null;
    if (!isHttpUrl(fanpageUrl)) return null;
    if (!email) return null;

    const hotlinesRaw = raw.hotlines;
    if (!Array.isArray(hotlinesRaw)) return null;
    const hotlines: Hotline[] = [];
    const seen = new Set<string>();
    for (const item of hotlinesRaw) {
        const h = validateHotline(item);
        if (!h) return null;
        if (seen.has(h.id)) return null;
        seen.add(h.id);
        hotlines.push(h);
    }

const DEFAULT_FOOTER_LOGO: LogoStyle = {
    mode: 'contained',
    width: 64,
    height: 64,
    radius: 8,
    bg: 'rgba(255,255,255,0.1)',
    padding: 4,
    objectFit: 'contain',
};

const DEFAULT_NAV_LOGO: LogoStyle = {
    mode: 'contained',
    width: 44,
    height: 44,
    radius: 22,
    bg: 'transparent',
    padding: 4,
    objectFit: 'contain',
};

    const logoStyle: LogoStyle = validateLogoStyle(raw.logoStyle, DEFAULT_FOOTER_LOGO);
    const navLogoStyle: LogoStyle = validateLogoStyle(raw.navLogoStyle, DEFAULT_NAV_LOGO);
    const navLogo = isString(raw.navLogo) ? cleanText(raw.navLogo) : '';

    return {
        logo: logo || '/logo.png',
        navLogo,
        logoStyle,
        navLogoStyle,
        name,
        shortName,
        hq,
        office,
        websiteLabel,
        websiteUrl,
        fanpageLabel,
        fanpageUrl,
        hotlines,
        email,
    };
}

export async function PUT(request: Request) {
    if (!(await requireAuth())) {
        return jsonError('Unauthorized', 401);
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonError('Invalid JSON');
    }
    const raw = (body as { company?: unknown })?.company;
    const company = validateCompany(raw);
    if (!company) {
        return jsonError('Invalid company payload');
    }
    const next = await updateCompany(company);
    return jsonOk({ company: next.company });
}
