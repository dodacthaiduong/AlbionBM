import { setRequestLocale } from 'next-intl/server';
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

    const settings = await getSettings();
    return <SettingClient initialSettings={settings} />;
}
