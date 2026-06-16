'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { routing, type Locale } from '@/i18n/routing';
import styles from './setting.module.css';

export default function SettingLayoutClient({ children }: { children: ReactNode }) {
    const t = useTranslations('setting');
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();
    const [isPending, startTransition] = useTransition();

    const isOnOverview = pathname?.endsWith('/setting') ?? false;
    const isOnFooter = pathname?.includes('/setting/footer') ?? false;
    const isOnNavbar = pathname?.includes('/setting/navbar') ?? false;
    const isInSettings = isOnOverview || isOnFooter || isOnNavbar;
    const [open, setOpen] = useState(isInSettings);

    function switchLocale(next: Locale) {
        if (next === currentLocale) return;
        startTransition(() => {
            router.replace(pathname, { locale: next });
        });
    }

    async function onLogout() {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/admin');
        router.refresh();
    }

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarBrand}>
                    <div className={styles.sidebarBrandDot} aria-hidden="true" />
                    <div>
                        <div className={styles.sidebarBrandName}>{t('sidebarBrand')}</div>
                        <div className={styles.sidebarBrandSub}>{t('sidebarSub')}</div>
                    </div>
                </div>

                <nav className={styles.sidebarNav} aria-label={t('sidebarNavAria')}>
                    <button
                        type="button"
                        className={`${styles.sidebarItem} ${styles.sidebarItemToggle} ${
                            isInSettings ? styles.sidebarItemActive : ''
                        }`}
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                    >
                        <span>{t('navSettings')}</span>
                        <span
                            className={`${styles.caret} ${open ? styles.caretOpen : ''}`}
                            aria-hidden="true"
                        >
                            ›
                        </span>
                    </button>

                    {open && (
                        <div className={styles.sidebarSub}>
                            <Link
                                href="/setting"
                                className={`${styles.sidebarSubItem} ${
                                    isOnOverview ? styles.sidebarSubItemActive : ''
                                }`}
                                aria-current={isOnOverview ? 'page' : undefined}
                            >
                                {t('navOverview')}
                            </Link>
                            <Link
                                href="/setting/footer"
                                className={`${styles.sidebarSubItem} ${
                                    isOnFooter ? styles.sidebarSubItemActive : ''
                                }`}
                                aria-current={isOnFooter ? 'page' : undefined}
                            >
                                {t('navFooter')}
                            </Link>
                            <Link
                                href="/setting/navbar"
                                className={`${styles.sidebarSubItem} ${
                                    isOnNavbar ? styles.sidebarSubItemActive : ''
                                }`}
                                aria-current={isOnNavbar ? 'page' : undefined}
                            >
                                {t('navNavbar')}
                            </Link>
                        </div>
                    )}
                </nav>

                <div className={styles.sidebarLang} role="group" aria-label={t('sidebarLangAria')}>
                    {routing.locales.map((loc) => {
                        const active = loc === currentLocale;
                        const flag = loc === 'vi' ? '🇻🇳' : '🇬🇧';
                        const label = loc === 'vi' ? t('langVi') : t('langEn');
                        return (
                            <button
                                key={loc}
                                type="button"
                                aria-label={label}
                                aria-pressed={active}
                                onClick={() => switchLocale(loc)}
                                disabled={isPending}
                                className={`${styles.langBtn} ${
                                    active ? styles.langBtnActive : ''
                                }`}
                            >
                                <span aria-hidden="true">{flag}</span>
                                <span className={styles.langBtnLabel}>{label}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className={styles.sidebarLogout}
                    onClick={onLogout}
                >
                    {t('logout')}
                </button>
            </aside>

            <main className={styles.content}>{children}</main>
        </div>
    );
}
