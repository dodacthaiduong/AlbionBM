'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Settings as AppSettings } from '@/lib/settings-types';
import { HeroSection, LinkListSection, TabBtn } from './_components/Sections';
import { SettingsPreview } from './_components/Preview';
import styles from './setting.module.css';

type Tab = 'hero' | 'nav';

export default function SettingClient({ initialSettings }: { initialSettings: AppSettings }) {
    const t = useTranslations('setting');
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [tab, setTab] = useState<Tab>('hero');
    const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
    const [busy, setBusy] = useState(false);

    function showToast(next: { type: 'ok' | 'err'; msg: string }) {
        setToast(next);
        setTimeout(() => setToast(null), 3000);
    }

    return (
        <div className={styles.pageLayout}>
            <div className={styles.formColumn}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>{t('pageOverviewTitle')}</h1>
                </div>
                <p className={styles.intro}>{t('overviewIntro')}</p>

                <div className={styles.tabs} role="tablist">
                    <TabBtn id="hero" active={tab === 'hero'} onClick={setTab}>
                        {t('tabHero')}
                    </TabBtn>
                    <TabBtn id="nav" active={tab === 'nav'} onClick={setTab}>
                        {t('tabNav')}
                    </TabBtn>
                </div>

                {tab === 'hero' && (
                    <HeroSection
                        blocks={settings.heroBlocks}
                        onChange={(heroBlocks) =>
                            setSettings((s) => ({ ...s, heroBlocks }))
                        }
                        onToast={showToast}
                        onBusyChange={setBusy}
                        onSaved={() => setSettings((s) => ({ ...s }))}
                    />
                )}
                {tab === 'nav' && (
                    <LinkListSection
                        sectionKey="nav"
                        items={settings.navItems}
                        onChange={(navItems) =>
                            setSettings((s) => ({ ...s, navItems }))
                        }
                        onToast={showToast}
                        onBusyChange={setBusy}
                        onSaved={() => setSettings((s) => ({ ...s }))}
                    />
                )}

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
