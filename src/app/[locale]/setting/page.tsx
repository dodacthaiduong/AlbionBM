import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { SESSION_COOKIE, isAuthenticated } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import SettingClient from './SettingClient';

export const dynamic = 'force-dynamic';

export default async function SettingPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const store = await cookies();
    const session = store.get(SESSION_COOKIE)?.value;
    if (!isAuthenticated(session)) {
        redirect(`/${locale}/admin`);
    }

    const settings = await getSettings();
    return <SettingClient initialBlocks={settings.heroBlocks} />;
}
