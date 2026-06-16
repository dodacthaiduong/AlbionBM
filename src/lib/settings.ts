import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { connect } from './mongoose';
import { SettingsModel } from './models/Settings';
import type {
    Company,
    HeroBlock,
    Hotline,
    LinkItem,
    LogoStyle,
    Settings,
} from './settings-types';

export type { HeroBlock, Hotline, Company, LinkItem, Settings };

const SETTINGS_ID = 'singleton';
const LEGACY_FILE = path.join(process.cwd(), 'data', 'settings.json');
const DEFAULT_HERO_IMAGE = '/hero-bg.jpg';

const DEFAULT_HERO_BLOCKS: HeroBlock[] = [
    {
        id: 'home',
        image: DEFAULT_HERO_IMAGE,
        title: 'Forco Travel & Event',
        subtitle: 'Đối tác tin cậy cho mọi hành trình và sự kiện của bạn.',
    },
    {
        id: 'domestic',
        image: DEFAULT_HERO_IMAGE,
        title: 'Du lịch trong nước',
        subtitle: 'Khám phá vẻ đẹp Việt Nam từ Bắc vào Nam.',
    },
    {
        id: 'international',
        image: DEFAULT_HERO_IMAGE,
        title: 'Du lịch quốc tế',
        subtitle: 'Hành trình khắp thế giới cùng đội ngũ chuyên nghiệp.',
    },
    {
        id: 'event',
        image: DEFAULT_HERO_IMAGE,
        title: 'Tổ chức sự kiện',
        subtitle: 'Hội nghị, team building, sự kiện doanh nghiệp trọn gói.',
    },
    {
        id: 'contact',
        image: DEFAULT_HERO_IMAGE,
        title: 'Liên hệ tư vấn',
        subtitle: 'Đội ngũ tư vấn sẵn sàng hỗ trợ bạn 24/7.',
    },
];

const DEFAULT_HOTLINES: Hotline[] = [
    { id: 'hotline-1', label: 'Hotline 1', number: '0877.58.2222' },
    { id: 'hotline-2', label: 'Hotline 2', number: '0877.59.5555' },
];

const DEFAULT_LOGO_STYLE: LogoStyle = {
    mode: 'contained',
    width: 64,
    height: 64,
    radius: 8,
    bg: 'rgba(255,255,255,0.1)',
    padding: 4,
    objectFit: 'contain',
};

const DEFAULT_NAV_LOGO_STYLE: LogoStyle = {
    mode: 'contained',
    width: 44,
    height: 44,
    radius: 22,
    bg: 'transparent',
    padding: 4,
    objectFit: 'contain',
};

const DEFAULT_COMPANY: Company = {
    logo: '/logo.png',
    navLogo: '',
    logoStyle: DEFAULT_LOGO_STYLE,
    navLogoStyle: DEFAULT_NAV_LOGO_STYLE,
    name: 'Forco Travel & Event',
    shortName: 'FORCO',
    hq: 'Trụ sở: 33 Phạm Ngũ Lão, Cửa Nam, Hà Nội',
    office: 'VPGD: 03 Trần Khánh Dư, Cửa Nam, Hà Nội',
    websiteLabel: 'www.forco.com.vn',
    websiteUrl: 'https://www.forco.com.vn',
    fanpageLabel: 'facebook.com/forcotravel',
    fanpageUrl: 'https://facebook.com/forcotravel',
    hotlines: DEFAULT_HOTLINES,
    email: 'info@forco.com.vn',
};

const DEFAULT_SERVICES: LinkItem[] = [
    { id: 'svc-tours', label: 'Tour du lịch', href: '/tour-du-lich' },
    { id: 'svc-events', label: 'Tổ chức sự kiện', href: '/to-chuc-su-kien' },
    { id: 'svc-flights', label: 'Vé máy bay', href: '/dich-vu-du-lich' },
    { id: 'svc-transport', label: 'Dịch vụ vận chuyển', href: '/dich-vu-du-lich' },
    { id: 'svc-hotel', label: 'Đặt phòng khách sạn', href: '/dich-vu-du-lich' },
    { id: 'svc-visa', label: 'Visa – Hộ chiếu', href: '/dich-vu-du-lich' },
];

const DEFAULT_QUICK_LINKS: LinkItem[] = [
    { id: 'ql-home', label: 'Trang chủ', href: '/' },
    { id: 'ql-about', label: 'Về chúng tôi', href: '/gioi-thieu' },
    { id: 'ql-contact', label: 'Liên hệ', href: '/lien-he' },
];

const DEFAULT_NAV_ITEMS: LinkItem[] = [
    { id: 'nav-home', label: 'Trang chủ', href: '/' },
    { id: 'nav-about', label: 'Giới thiệu', href: '/gioi-thieu' },
    { id: 'nav-tours', label: 'Tour du lịch', href: '/tour-du-lich' },
    { id: 'nav-services', label: 'Dịch vụ du lịch', href: '/dich-vu-du-lich' },
    { id: 'nav-events', label: 'Tổ chức sự kiện', href: '/to-chuc-su-kien' },
    { id: 'nav-careers', label: 'Tuyển dụng', href: '/tuyen-dung' },
    { id: 'nav-contact', label: 'Liên hệ', href: '/lien-he' },
];

function buildDefaults(): Settings {
    return {
        heroBlocks: DEFAULT_HERO_BLOCKS,
        company: DEFAULT_COMPANY,
        services: DEFAULT_SERVICES,
        quickLinks: DEFAULT_QUICK_LINKS,
        navItems: DEFAULT_NAV_ITEMS,
    };
}

async function readLegacy(): Promise<Partial<Settings> | null> {
    try {
        const raw = await fs.readFile(LEGACY_FILE, 'utf8');
        const parsed = JSON.parse(raw) as {
            heroImage?: string;
            heroBlocks?: HeroBlock[];
        };
        if (parsed.heroBlocks && parsed.heroBlocks.length > 0) {
            return { heroBlocks: parsed.heroBlocks };
        }
        if (parsed.heroImage) {
            return {
                heroBlocks: DEFAULT_HERO_BLOCKS.map((b, i) =>
                    i === 0 ? { ...b, image: parsed.heroImage! } : b
                ),
            };
        }
        return null;
    } catch {
        return null;
    }
}

let seedPromise: Promise<void> | null = null;

async function ensureSeeded(): Promise<void> {
    if (seedPromise) return seedPromise;
    seedPromise = (async () => {
        await connect();
        const existing = await SettingsModel.findById(SETTINGS_ID).lean();
        if (existing) return;

        const legacy = await readLegacy();
        const defaults = buildDefaults();
        const seed: Settings = legacy
            ? { ...defaults, ...legacy }
            : defaults;

        try {
            await SettingsModel.create({ _id: SETTINGS_ID, ...seed });
        } catch (err: unknown) {
            const code = (err as { code?: number })?.code;
            if (code !== 11000) throw err;
        }
    })();
    return seedPromise;
}

function toPlain(doc: Record<string, unknown> | null): Settings {
    if (!doc) return buildDefaults();
    return {
        heroBlocks: (doc.heroBlocks as HeroBlock[]) ?? DEFAULT_HERO_BLOCKS,
        company: {
            ...DEFAULT_COMPANY,
            ...((doc.company as Partial<Company>) ?? {}),
            logoStyle: {
                ...DEFAULT_LOGO_STYLE,
                ...(((doc.company as { logoStyle?: Partial<LogoStyle> })?.logoStyle) ??
                    {}),
            },
            navLogoStyle: {
                ...DEFAULT_NAV_LOGO_STYLE,
                ...(((doc.company as { navLogoStyle?: Partial<LogoStyle> })
                    ?.navLogoStyle) ?? {}),
            },
            navLogo:
                ((doc.company as { navLogo?: string })?.navLogo) ||
                ((doc.company as { logo?: string })?.logo) ||
                DEFAULT_COMPANY.logo,
            hotlines:
                ((doc.company as { hotlines?: Hotline[] })?.hotlines) ??
                DEFAULT_HOTLINES,
        },
        services: (doc.services as LinkItem[]) ?? DEFAULT_SERVICES,
        quickLinks: (doc.quickLinks as LinkItem[]) ?? DEFAULT_QUICK_LINKS,
        navItems: (doc.navItems as LinkItem[]) ?? DEFAULT_NAV_ITEMS,
    };
}

export async function getSettings(): Promise<Settings> {
    await ensureSeeded();
    const doc = await SettingsModel.findById(SETTINGS_ID).lean();
    return toPlain(doc as Record<string, unknown> | null);
}

async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
    await ensureSeeded();
    const current = await getSettings();
    const next: Settings = { ...current, ...patch };
    await SettingsModel.findByIdAndUpdate(
        SETTINGS_ID,
        { $set: { ...next } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return next;
}

export async function updateHeroBlocks(blocks: HeroBlock[]): Promise<Settings> {
    return saveSettings({ heroBlocks: blocks });
}

export async function updateCompany(company: Company): Promise<Settings> {
    return saveSettings({ company });
}

export async function updateServices(services: LinkItem[]): Promise<Settings> {
    return saveSettings({ services });
}

export async function updateQuickLinks(
    quickLinks: LinkItem[]
): Promise<Settings> {
    return saveSettings({ quickLinks });
}

export async function updateNavItems(navItems: LinkItem[]): Promise<Settings> {
    return saveSettings({ navItems });
}

export function newId(prefix: string): string {
    return `${prefix}-${randomUUID()}`;
}
