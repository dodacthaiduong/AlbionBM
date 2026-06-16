import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { SESSION_COOKIE, isAuthenticated } from '@/lib/auth';
import SettingLayoutClient from './SettingLayoutClient';

export const dynamic = 'force-dynamic';

export default async function SettingLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const store = await cookies();
    const session = store.get(SESSION_COOKIE)?.value;
    if (!isAuthenticated(session)) {
        redirect(`/${locale}/admin`);
    }

    return <SettingLayoutClient>{children}</SettingLayoutClient>;
}
