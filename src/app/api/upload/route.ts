import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_VALUE } from '@/lib/auth';
import { getSettings, updateHeroBlocks } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function extFromMime(mime: string): string {
    switch (mime) {
        case 'image/jpeg': return '.jpg';
        case 'image/png': return '.png';
        case 'image/webp': return '.webp';
        case 'image/gif': return '.gif';
        default: return '';
    }
}

export async function POST(request: Request) {
    const store = await cookies();
    if (store.get(SESSION_COOKIE)?.value !== SESSION_VALUE) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
    }

    const file = form.get('file');
    const blockId = form.get('blockId');
    if (!(file instanceof File)) {
        return NextResponse.json({ ok: false, error: 'No file uploaded' }, { status: 400 });
    }
    if (typeof blockId !== 'string' || !blockId) {
        return NextResponse.json({ ok: false, error: 'Missing blockId' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json({ ok: false, error: 'File too large (max 8MB)' }, { status: 413 });
    }
    if (!ALLOWED.has(file.type)) {
        return NextResponse.json({ ok: false, error: 'Unsupported file type' }, { status: 415 });
    }

    const settings = await getSettings();
    const target = settings.heroBlocks.find((b) => b.id === blockId);
    if (!target) {
        return NextResponse.json({ ok: false, error: 'Block not found' }, { status: 404 });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = extFromMime(file.type);
    const filename = `hero-${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;
    const nextBlocks = settings.heroBlocks.map((b) =>
        b.id === blockId ? { ...b, image: url } : b
    );
    await updateHeroBlocks(nextBlocks);

    return NextResponse.json({ ok: true, blockId, image: url });
}
