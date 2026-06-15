import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { SESSION_COOKIE, SESSION_VALUE } from '@/lib/auth';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const SETTING_RE = /^\/(?:(vi|en)\/)?setting\/?$/;

function getLocalePrefix(pathname: string): string {
    const m = pathname.match(/^\/(vi|en)(?:\/|$)/);
    return m ? `/${m[1]}` : '';
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (SETTING_RE.test(pathname)) {
        const session = request.cookies.get(SESSION_COOKIE)?.value;
        if (session !== SESSION_VALUE) {
            const url = request.nextUrl.clone();
            url.pathname = `${getLocalePrefix(pathname)}/admin`;
            url.search = '';
            return NextResponse.redirect(url);
        }
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
