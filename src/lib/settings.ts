import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { HeroBlock, Settings } from './settings-types';

export type { HeroBlock, Settings };

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_HERO_IMAGE = '/hero-bg.jpg';

const DEFAULT_BLOCKS: HeroBlock[] = [
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

const DEFAULTS: Settings = {
    heroBlocks: DEFAULT_BLOCKS,
};

type LegacySettings = {
    heroImage?: string;
    heroBlocks?: HeroBlock[];
};

function migrate(parsed: LegacySettings): Settings {
    if (Array.isArray(parsed.heroBlocks) && parsed.heroBlocks.length > 0) {
        return { heroBlocks: parsed.heroBlocks };
    }
    if (parsed.heroImage) {
        return {
            heroBlocks: DEFAULT_BLOCKS.map((b, i) =>
                i === 0 ? { ...b, image: parsed.heroImage! } : b
            ),
        };
    }
    return DEFAULTS;
}

async function ensureFile(): Promise<void> {
    try {
        await fs.access(SETTINGS_FILE);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULTS, null, 2), 'utf8');
    }
}

export async function getSettings(): Promise<Settings> {
    await ensureFile();
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw) as LegacySettings;
        return migrate(parsed);
    } catch {
        return DEFAULTS;
    }
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const current = await getSettings();
    const next: Settings = { ...current, ...patch };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
    return next;
}

export async function updateHeroBlocks(blocks: HeroBlock[]): Promise<Settings> {
    return updateSettings({ heroBlocks: blocks });
}

export function newBlockId(): string {
    return randomUUID();
}
