'use client';

import { useTranslations } from 'next-intl';
import type { Settings } from '@/lib/settings-types';
import { logoBoxStyle, logoImgStyle } from './Sections';
import styles from '../setting.module.css';

export function SettingsPreview({ settings }: { settings: Settings }) {
    const t = useTranslations('setting');
    return (
        <div className={styles.previewBox}>
            <div className={styles.previewHeader}>
                <h2 className={styles.previewTitle}>{t('preview')}</h2>
                <p className={styles.previewHint}>{t('previewHint')}</p>
            </div>
            <PreviewNavbar settings={settings} />
            <PreviewFooter settings={settings} />
        </div>
    );
}

function PreviewNavbar({ settings }: { settings: Settings }) {
    const t = useTranslations('nav');
    const style = settings.company.navLogoStyle;
    return (
        <div className={styles.previewNav}>
            <div className={styles.previewNavInner}>
                <div className={styles.previewLogo}>
                    {settings.company.navLogo ? (
                        <span
                            className={
                                style.mode === 'full'
                                    ? `${styles.previewLogoBox} ${styles.previewLogoBoxFull}`
                                    : styles.previewLogoBox
                            }
                            style={logoBoxStyle(style)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={settings.company.navLogo}
                                alt="logo"
                                style={logoImgStyle(style)}
                            />
                        </span>
                    ) : (
                        <span className={styles.previewLogoFallback}>
                            {settings.company.shortName.slice(0, 1) || 'F'}
                        </span>
                    )}
                    <span className={styles.previewBrand}>
                        {settings.company.shortName}
                    </span>
                </div>
                <ul className={styles.previewNavList}>
                    {settings.navItems.slice(0, 5).map((it) => (
                        <li key={it.id}>{it.label || t('untitled')}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function PreviewFooter({ settings }: { settings: Settings }) {
    const style = settings.company.logoStyle;
    return (
        <div className={styles.previewFooter}>
            <div className={styles.previewFooterGrid}>
                <div>
                    <div className={styles.previewLogo}>
                        {settings.company.logo ? (
                            <span
                                className={
                                    style.mode === 'full'
                                        ? `${styles.previewLogoBox} ${styles.previewLogoBoxFull}`
                                        : styles.previewLogoBox
                                }
                                style={logoBoxStyle(style)}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={settings.company.logo}
                                    alt="logo"
                                    style={logoImgStyle(style)}
                                />
                            </span>
                        ) : (
                            <span className={styles.previewLogoFallback}>
                                {settings.company.shortName.slice(0, 1) || 'F'}
                            </span>
                        )}
                    </div>
                    <div className={styles.previewFooterName}>
                        {settings.company.name}
                    </div>
                </div>
                <div>
                    <div className={styles.previewFooterTitle}>
                        {settings.company.name}
                    </div>
                    <ul className={styles.previewFooterList}>
                        <li>{settings.company.hq}</li>
                        <li>{settings.company.office}</li>
                        <li>{settings.company.websiteLabel}</li>
                        <li>{settings.company.fanpageLabel}</li>
                        {settings.company.hotlines.map((h) => (
                            <li key={h.id}>
                                {h.label}: {h.number}
                            </li>
                        ))}
                        <li>{settings.company.email}</li>
                    </ul>
                </div>
                <div>
                    <div className={styles.previewFooterTitle}>Dịch vụ</div>
                    <ul className={styles.previewFooterList}>
                        {settings.services.slice(0, 6).map((s) => (
                            <li key={s.id}>{s.label || '—'}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <div className={styles.previewFooterTitle}>Thông tin</div>
                    <ul className={styles.previewFooterList}>
                        {settings.quickLinks.map((q) => (
                            <li key={q.id}>{q.label || '—'}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
