import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_VALUE } from './auth';

export async function requireAuth(): Promise<boolean> {
    const store = await cookies();
    return store.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export function jsonError(message: string, status = 400) {
    return Response.json({ ok: false, error: message }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(data: T) {
    return Response.json({ ok: true, ...data });
}

export function isString(v: unknown): v is string {
    return typeof v === 'string';
}

export function isObject(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function cleanHref(href: string): string {
    return href.trim();
}

export function cleanText(text: string): string {
    return text.trim();
}

export function isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}
