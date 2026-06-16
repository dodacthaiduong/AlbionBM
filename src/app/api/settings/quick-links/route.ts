import { updateQuickLinks } from '@/lib/settings';
import type { LinkItem } from '@/lib/settings-types';
import { cleanHref, cleanText, isObject, isString, jsonError, jsonOk, requireAuth } from '@/lib/api';

export const dynamic = 'force-dynamic';

function validateItem(raw: unknown): LinkItem | null {
    if (!isObject(raw)) return null;
    if (!isString(raw.id) || !raw.id) return null;
    const label = isString(raw.label) ? cleanText(raw.label) : '';
    const href = isString(raw.href) ? cleanHref(raw.href) : '';
    if (!label || !href) return null;
    if (!href.startsWith('/')) return null;
    return { id: raw.id, label, href };
}

function validateList(raw: unknown): LinkItem[] | null {
    if (!Array.isArray(raw)) return null;
    const seen = new Set<string>();
    const out: LinkItem[] = [];
    for (const item of raw) {
        const v = validateItem(item);
        if (!v) return null;
        if (seen.has(v.id)) return null;
        seen.add(v.id);
        out.push(v);
    }
    return out;
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
    const items = validateList((body as { items?: unknown })?.items);
    if (!items) {
        return jsonError('Invalid quick links payload');
    }
    const next = await updateQuickLinks(items);
    return jsonOk({ quickLinks: next.quickLinks });
}
