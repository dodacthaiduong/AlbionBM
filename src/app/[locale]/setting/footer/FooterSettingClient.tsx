'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Settings as AppSettings } from '@/lib/settings-types';
import {
    CompanySection,
    LinkListSection,
    TabBtn,
} from '../_components/Sections';
import { SettingsPreview } from '../_components/Preview';
import styles from '../setting.module.css';

type Tab = 'company' | 'services' | 'quickLinks';

export default function FooterSettingClient({
    initialSettings,
}: {
    initialSettings: AppSettings;
}) {
    const t = useTranslations('setting');
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [tab, setTab] = useState<Tab>('company');
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
                    <h1 className={styles.pageTitle}>{t('pageFooterTitle')}</h1>
                </div>
                <p className={styles.intro}>{t('footerIntro')}</p>

                <div className={styles.tabs} role="tablist">
                    <TabBtn
                        id="company"
                        active={tab === 'company'}
                        onClick={setTab}
                    >
                        {t('tabCompany')}
                    </TabBtn>
                    <TabBtn
                        id="services"
                        active={tab === 'services'}
                        onClick={setTab}
                    >
                        {t('tabServices')}
                    </TabBtn>
                    <TabBtn
                        id="quickLinks"
                        active={tab === 'quickLinks'}
                        onClick={setTab}
                    >
                        {t('tabQuickLinks')}
                    </TabBtn>
                </div>

                {tab === 'company' && (
                    <CompanySection
                        company={settings.company}
                        onChange={(company) =>
                            setSettings((s) => ({ ...s, company }))
                        }
                        onToast={showToast}
                        onBusyChange={setBusy}
                        onSaved={() => setSettings((s) => ({ ...s }))}
                    />
                )}
                {tab === 'services' && (
                    <LinkListSection
                        sectionKey="services"
                        items={settings.services}
                        onChange={(services) =>
                            setSettings((s) => ({ ...s, services }))
                        }
                        onToast={showToast}
                        onBusyChange={setBusy}
                        onSaved={() => setSettings((s) => ({ ...s }))}
                    />
                )}
                {tab === 'quickLinks' && (
                    <LinkListSection
                        sectionKey="quickLinks"
                        items={settings.quickLinks}
                        onChange={(quickLinks) =>
                            setSettings((s) => ({ ...s, quickLinks }))
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
