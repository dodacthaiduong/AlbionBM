import { setRequestLocale } from 'next-intl/server';
import { getSettings } from '@/lib/settings';
import FooterSettingClient from './FooterSettingClient';

export const dynamic = 'force-dynamic';

export default async function FooterSettingPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const settings = await getSettings();
    return <FooterSettingClient initialSettings={settings} />;
}
