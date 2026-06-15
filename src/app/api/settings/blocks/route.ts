import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_VALUE } from '@/lib/auth';
import { updateHeroBlocks } from '@/lib/settings';
import type { HeroBlock } from '@/lib/settings-types';

export const dynamic = 'force-dynamic';

function isString(v: unknown): v is string {
    return typeof v === 'string';
}

function validateBlock(raw: unknown): HeroBlock | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    if (!isString(r.id) || !r.id) return null;
    if (!isString(r.image)) return null;
    if (!isString(r.title)) return null;
    if (!isString(r.subtitle)) return null;
    return { id: r.id, image: r.image, title: r.title, subtitle: r.subtitle };
}

export async function PUT(request: Request) {
    const store = await cookies();
    if (store.get(SESSION_COOKIE)?.value !== SESSION_VALUE) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const raw = (body as { blocks?: unknown })?.blocks;
    if (!Array.isArray(raw) || raw.length === 0) {
        return NextResponse.json({ ok: false, error: 'blocks must be a non-empty array' }, { status: 400 });
    }

    const blocks: HeroBlock[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
        const block = validateBlock(item);
        if (!block) {
            return NextResponse.json({ ok: false, error: 'Invalid block' }, { status: 400 });
        }
        if (seen.has(block.id)) {
            return NextResponse.json({ ok: false, error: 'Duplicate block id' }, { status: 400 });
        }
        seen.add(block.id);
        blocks.push(block);
    }

    const next = await updateHeroBlocks(blocks);
    return NextResponse.json({ ok: true, blocks: next.heroBlocks });
}
