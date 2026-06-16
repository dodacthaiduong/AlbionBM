'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Settings as AppSettings } from '@/lib/settings-types';
import { NavbarLogoSection } from '../_components/Sections';
import { SettingsPreview } from '../_components/Preview';
import styles from '../setting.module.css';

export default function NavbarSettingClient({
    initialSettings,
}: {
    initialSettings: AppSettings;
}) {
    const t = useTranslations('setting');
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
    const [busy, setBusy] = useState(false);

    function showToast(next: { type: 'ok' | 'err'; msg: string }) {
        setToast(next);
        setTimeout(() => setToast(null), 3000);
    }

    async function onSave() {
        setBusy(true);
        try {
            const res = await fetch('/api/settings/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company: settings.company }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                showToast({ type: 'err', msg: data.error ?? t('toastSaveFail') });
                return;
            }
            showToast({ type: 'ok', msg: t('toastSaved') });
        } catch {
            showToast({ type: 'err', msg: t('toastNetwork') });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className={styles.pageLayout}>
            <div className={styles.formColumn}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>{t('pageNavbarTitle')}</h1>
                </div>
                <p className={styles.intro}>{t('navbarIntro')}</p>

                <NavbarLogoSection
                    navLogo={settings.company.navLogo}
                    fallbackLogo={settings.company.logo}
                    navLogoStyle={settings.company.navLogoStyle}
                    onChange={(navLogoStyle) =>
                        setSettings((s) => ({
                            ...s,
                            company: { ...s.company, navLogoStyle },
                        }))
                    }
                    onNavLogoUrlChanged={(navLogo) =>
                        setSettings((s) => ({
                            ...s,
                            company: { ...s.company, navLogo },
                        }))
                    }
                    onToast={showToast}
                    onBusyChange={setBusy}
                    onSaved={onSave}
                />

                {toast && (
                    <div
                        className={`${styles.toast} ${
                            toast.type === 'ok' ? styles.toastOk : styles.toastErr
                        }`}
                    >
                        {toast.msg}
                    </div>
                )}

                {busy && <div className={styles.busyOverlay}>{t('working')}</div>}
            </div>

            <aside className={styles.previewColumn}>
                <SettingsPreview settings={settings} />
            </aside>
        </div>
    );
}
