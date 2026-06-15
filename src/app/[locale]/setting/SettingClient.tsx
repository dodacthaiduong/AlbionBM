'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { HeroBlock } from '@/lib/settings-types';
import styles from './setting.module.css';

type Props = {
    initialBlocks: HeroBlock[];
};

type PendingMap = Record<string, File | null>;

export default function SettingClient({ initialBlocks }: Props) {
    const t = useTranslations('setting');
    const router = useRouter();
    const [blocks, setBlocks] = useState<HeroBlock[]>(initialBlocks);
    const [pending, setPending] = useState<PendingMap>({});
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    function showToast(t: { type: 'ok' | 'err'; msg: string }) {
        setToast(t);
        setTimeout(() => setToast(null), 3000);
    }

    function onPick(blockId: string, e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setPending((p) => ({ ...p, [blockId]: file }));
        setToast(null);
    }

    async function onUpload(blockId: string) {
        const file = pending[blockId];
        if (!file) return;
        setUploadingId(blockId);
        setToast(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('blockId', blockId);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                showToast({ type: 'err', msg: data.error ?? t('toastUploadFail') });
                return;
            }
            setBlocks((bs) =>
                bs.map((b) => (b.id === blockId ? { ...b, image: data.image } : b))
            );
            setPending((p) => ({ ...p, [blockId]: null }));
            const el = inputRefs.current[blockId];
            if (el) el.value = '';
            showToast({ type: 'ok', msg: t('toastImageUpdated') });
            router.refresh();
        } catch {
            showToast({ type: 'err', msg: t('toastNetwork') });
        } finally {
            setUploadingId(null);
        }
    }

    function updateBlock(id: string, patch: Partial<HeroBlock>) {
        setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    }

    function addBlock() {
        const id = `block-${Date.now()}`;
        setBlocks((bs) => [
            ...bs,
            { id, image: '/hero-bg.jpg', title: '', subtitle: '' },
        ]);
    }

    function removeBlock(id: string) {
        setBlocks((bs) => bs.filter((b) => b.id !== id));
        setPending((p) => {
            const next = { ...p };
            delete next[id];
            return next;
        });
    }

    function moveBlock(id: string, dir: -1 | 1) {
        setBlocks((bs) => {
            const idx = bs.findIndex((b) => b.id === id);
            if (idx < 0) return bs;
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= bs.length) return bs;
            const next = bs.slice();
            const [item] = next.splice(idx, 1);
            next.splice(nextIdx, 0, item);
            return next;
        });
    }

    async function onSave() {
        setSaving(true);
        setToast(null);
        try {
            const res = await fetch('/api/settings/blocks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                showToast({ type: 'err', msg: data.error ?? t('toastSaveFail') });
                return;
            }
            showToast({ type: 'ok', msg: t('toastSaved') });
            router.refresh();
        } catch {
            showToast({ type: 'err', msg: t('toastNetwork') });
        } finally {
            setSaving(false);
        }
    }

    async function onLogout() {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/admin');
        router.refresh();
    }

    return (
        <div className={styles.body}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <div className={styles.headerActions}>
                        <button
                            type="button"
                            className={styles.saveBtn}
                            onClick={onSave}
                            disabled={saving}
                        >
                            {saving ? t('saving') : t('save')}
                        </button>
                        <button
                            type="button"
                            className={styles.logout}
                            onClick={onLogout}
                        >
                            {t('logout')}
                        </button>
                    </div>
                </div>

                <p className={styles.intro}>{t('intro')}</p>

                <div className={styles.blockList}>
                    {blocks.map((block, idx) => (
                        <div key={block.id} className={styles.blockCard}>
                            <div className={styles.blockHeader}>
                                <span className={styles.blockIndex}>
                                    {t('blockIndex', { number: idx + 1 })}
                                </span>
                                <div className={styles.blockControls}>
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        onClick={() => moveBlock(block.id, -1)}
                                        disabled={idx === 0}
                                        aria-label={t('moveUp')}
                                        title={t('moveUp')}
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        onClick={() => moveBlock(block.id, 1)}
                                        disabled={idx === blocks.length - 1}
                                        aria-label={t('moveDown')}
                                        title={t('moveDown')}
                                    >
                                        ↓
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                        onClick={() => removeBlock(block.id)}
                                        disabled={blocks.length <= 1}
                                        aria-label={t('remove')}
                                        title={t('remove')}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div
                                className={styles.preview}
                                style={{ backgroundImage: `url(${block.image})` }}
                            >
                                <div className={styles.previewOverlay}>{block.image}</div>
                            </div>

                            <div className={styles.uploadRow}>
                                <input
                                    ref={(el) => {
                                        inputRefs.current[block.id] = el;
                                    }}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(e) => onPick(block.id, e)}
                                    className={styles.fileInput}
                                    id={`hero-upload-${block.id}`}
                                />
                                <label
                                    htmlFor={`hero-upload-${block.id}`}
                                    className={styles.fileLabel}
                                >
                                    {t('pickImage')}
                                </label>
                                <span className={styles.fileName}>
                                    {pending[block.id]
                                        ? pending[block.id]!.name
                                        : t('noFile')}
                                </span>
                                <button
                                    type="button"
                                    className={styles.uploadBtn}
                                    onClick={() => onUpload(block.id)}
                                    disabled={!pending[block.id] || uploadingId === block.id}
                                >
                                    {uploadingId === block.id ? t('uploading') : t('upload')}
                                </button>
                            </div>

                            <div className={styles.fields}>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('fieldTitle')}</span>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={block.title}
                                        onChange={(e) =>
                                            updateBlock(block.id, { title: e.target.value })
                                        }
                                        placeholder={t('titlePlaceholder')}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span className={styles.label}>{t('fieldSubtitle')}</span>
                                    <textarea
                                        className={styles.textarea}
                                        value={block.subtitle}
                                        onChange={(e) =>
                                            updateBlock(block.id, { subtitle: e.target.value })
                                        }
                                        placeholder={t('subtitlePlaceholder')}
                                        rows={2}
                                    />
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                <button type="button" className={styles.addBtn} onClick={addBlock}>
                    {t('addBlock')}
                </button>

                {toast && (
                    <div
                        className={`${styles.toast} ${toast.type === 'ok' ? styles.toastOk : styles.toastErr}`}
                    >
                        {toast.msg}
                    </div>
                )}
            </div>
        </div>
    );
}
