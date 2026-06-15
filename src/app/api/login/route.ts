import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_VALUE, TEST_CREDENTIALS } from '@/lib/auth';

export async function POST(request: Request) {
    let body: { username?: string; password?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Invalid request body' },
            { status: 400 }
        );
    }

    const { username, password } = body;
    if (
        username === TEST_CREDENTIALS.username &&
        password === TEST_CREDENTIALS.password
    ) {
        const store = await cookies();
        store.set(SESSION_COOKIE, SESSION_VALUE, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 8,
        });
        return NextResponse.json({ ok: true, redirect: '/setting' });
    }

    return NextResponse.json(
        { ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu' },
        { status: 401 }
    );
}
