'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import styles from './admin.module.css';

export default function AdminLoginPage() {
    const t = useTranslations('admin');
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError(data.error ?? t('errorInvalid'));
                return;
            }
            router.push(data.redirect ?? '/setting');
            router.refresh();
        } catch {
            setError(t('errorNetwork'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.body}>
            <div className={styles.card}>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.subtitle}>{t('subtitle')}</p>

                <form onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        <span className={styles.label}>{t('username')}</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>{t('password')}</span>
                        <input
                            type="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? t('submitting') : t('submit')}
                    </button>

                    {error && <div className={styles.error}>{error}</div>}
                </form>

                <div className={styles.hint}>
                    <strong>{t('testAccount')}</strong> user <code>admin</code> / pass <code>admin123</code>
                </div>

                <Link href="/" className={styles.back}>
                    {t('backHome')}
                </Link>
            </div>
        </div>
    );
}
