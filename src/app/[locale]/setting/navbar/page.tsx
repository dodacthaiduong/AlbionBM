import { setRequestLocale } from 'next-intl/server';
import { getSettings } from '@/lib/settings';
import NavbarSettingClient from './NavbarSettingClient';

export const dynamic = 'force-dynamic';

export default async function NavbarSettingPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const settings = await getSettings();
    return <NavbarSettingClient initialSettings={settings} />;
}
