'use client';

import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type {
    Company,
    HeroBlock,
    LinkItem,
    LogoMode,
    LogoObjectFit,
    LogoStyle,
} from '@/lib/settings-types';
import styles from '../setting.module.css';

const VALID_HREF_PREFIX = /^\//;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function logoBoxStyle(style: LogoStyle): React.CSSProperties {
    const base: React.CSSProperties = {
        width: style.width,
        height: style.height,
    };
    if (style.mode === 'full') {
        return base;
    }
    if (style.mode === 'cover') {
        return {
            ...base,
            borderRadius: style.radius,
            overflow: 'hidden',
        };
    }
    return {
        ...base,
        borderRadius: style.radius,
        background: style.bg ?? 'transparent',
        padding: style.padding,
        overflow: 'hidden',
    };
}

export function logoImgStyle(style: LogoStyle): React.CSSProperties {
    return {
        width: '100%',
        height: '100%',
        objectFit: style.objectFit,
    };
}

function LogoStyleControls({
    style,
    onChange,
    labels,
}: {
    style: LogoStyle;
    onChange: (next: LogoStyle) => void;
    labels: {
        mode: string;
        objectFit: string;
        width: string;
        height: string;
        radius: string;
        padding: string;
        bg: string;
        modeContained: string;
        modeFull: string;
        modeCover: string;
        fitContain: string;
        fitCover: string;
        fitFill: string;
        fitNone: string;
        fitScaleDown: string;
    };
}) {
    return (
        <>
            <div className={styles.fieldRow}>
                <label className={`${styles.field} ${styles.flex1}`}>
                    <span className={styles.label}>{labels.mode}</span>
                    <select
                        className={styles.input}
                        value={style.mode}
                        onChange={(e) =>
                            onChange({ ...style, mode: e.target.value as LogoMode })
                        }
                    >
                        <option value="contained">{labels.modeContained}</option>
                        <option value="full">{labels.modeFull}</option>
                        <option value="cover">{labels.modeCover}</option>
                    </select>
                </label>
                <label className={`${styles.field} ${styles.flex1}`}>
                    <span className={styles.label}>{labels.objectFit}</span>
                    <select
                        className={styles.input}
                        value={style.objectFit}
                        onChange={(e) =>
                            onChange({
                                ...style,
                                objectFit: e.target.value as LogoObjectFit,
                            })
                        }
                    >
                        <option value="contain">{labels.fitContain}</option>
                        <option value="cover">{labels.fitCover}</option>
                        <option value="fill">{labels.fitFill}</option>
                        <option value="none">{labels.fitNone}</option>
                        <option value="scale-down">{labels.fitScaleDown}</option>
                    </select>
                </label>
            </div>

            <div className={styles.fieldRow}>
                <label className={`${styles.field} ${styles.flex1}`}>
                    <span className={styles.label}>{labels.width}</span>
                    <input
                        type="number"
                        min={8}
                        max={512}
                        className={styles.input}
                        value={style.width}
                        onChange={(e) =>
                            onChange({ ...style, width: Number(e.target.value) || 0 })
                        }
                    />
                </label>
                <label className={`${styles.field} ${styles.flex1}`}>
                    <span className={styles.label}>{labels.height}</span>
                    <input
                        type="number"
                        min={8}
                        max={512}
                        className={styles.input}
                        value={style.height}
                        onChange={(e) =>
                            onChange({ ...style, height: Number(e.target.value) || 0 })
                        }
                    />
                </label>
            </div>

            <div className={styles.fieldRow}>
                <label className={`${styles.field} ${styles.flex1}`}>
                    <span className={styles.label}>{labels.radius}</span>
                    <input
                        type="number"
                        min={0}
                        max={256}
                        className={styles.input}
                        value={style.radius}
                        onChange={(e) =>
                            onChange({ ...style, radius: Number(e.target.value) || 0 })
                        }
                    />
                </label>
                <label className={`${styles.field} ${styles.flex1}`}>
                    <span className={styles.label}>{labels.padding}</span>
                    <input
                        type="number"
                        min={0}
                        max={256}
                        className={styles.input}
                        value={style.padding}
                        onChange={(e) =>
                            onChange({ ...style, padding: Number(e.target.value) || 0 })
                        }
                    />
                </label>
            </div>

            <label className={styles.field}>
                <span className={styles.label}>{labels.bg}</span>
                <input
                    type="text"
                    className={styles.input}
                    value={style.bg ?? ''}
                    onChange={(e) =>
                        onChange({ ...style, bg: e.target.value || null })
                    }
                    placeholder="rgba(255,255,255,0.1)"
                />
            </label>
        </>
    );
}

export function TabBtn<T extends string>({
    id,
    active,
    onClick,
    children,
}: {
    id: T;
    active: boolean;
    onClick: (id: T) => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => onClick(id)}
        >
            {children}
        </button>
    );
}

export function HeroSection({
    blocks,
    onChange,
    onToast,
    onBusyChange,
    onSaved,
}: {
    blocks: HeroBlock[];
    onChange: (next: HeroBlock[]) => void;
    onToast: (t: { type: 'ok' | 'err'; msg: string }) => void;
    onBusyChange: (busy: boolean) => void;
    onSaved: () => void;
}) {
    const t = useTranslations('setting');
    const router = useRouter();
    const [pending, setPending] = useState<Record<string, File | null>>({});
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    function onPick(id: string, e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setPending((p) => ({ ...p, [id]: file }));
    }

    async function onUpload(blockId: string) {
        const file = pending[blockId];
        if (!file) return;
        setUploadingId(blockId);
        onBusyChange(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('blockId', blockId);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                onToast({ type: 'err', msg: data.error ?? t('toastUploadFail') });
                return;
            }
            onChange(blocks.map((b) => (b.id === blockId ? { ...b, image: data.image } : b)));
            setPending((p) => ({ ...p, [blockId]: null }));
            const el = inputRefs.current[blockId];
            if (el) el.value = '';
            onToast({ type: 'ok', msg: t('toastImageUpdated') });
            onSaved();
            router.refresh();
        } catch {
            onToast({ type: 'err', msg: t('toastNetwork') });
        } finally {
            setUploadingId(null);
            onBusyChange(false);
        }
    }

    function updateBlock(id: string, patch: Partial<HeroBlock>) {
        onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    }
    function addBlock() {
        onChange([
            ...blocks,
            { id: `block-${Date.now()}`, image: '/hero-bg.jpg', title: '', subtitle: '' },
        ]);
    }
    function removeBlock(id: string) {
        onChange(blocks.filter((b) => b.id !== id));
    }
    function moveBlock(id: string, dir: -1 | 1) {
        const idx = blocks.findIndex((b) => b.id === id);
        if (idx < 0) return;
        const nextIdx = idx + dir;
        if (nextIdx < 0 || nextIdx >= blocks.length) return;
        const next = blocks.slice();
        const [item] = next.splice(idx, 1);
        next.splice(nextIdx, 0, item);
        onChange(next);
    }

    async function onSave() {
        onBusyChange(true);
        try {
            const res = await fetch('/api/settings/blocks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                onToast({ type: 'err', msg: data.error ?? t('toastSaveFail') });
                return;
            }
            onToast({ type: 'ok', msg: t('toastSaved') });
            onSaved();
            router.refresh();
        } catch {
            onToast({ type: 'err', msg: t('toastNetwork') });
        } finally {
            onBusyChange(false);
        }
    }

    return (
        <div className={styles.section}>
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
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => moveBlock(block.id, 1)}
                                disabled={idx === blocks.length - 1}
                                aria-label={t('moveDown')}
                            >
                                ↓
                            </button>
                            <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                onClick={() => removeBlock(block.id)}
                                disabled={blocks.length <= 1}
                                aria-label={t('remove')}
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
                            {pending[block.id] ? pending[block.id]!.name : t('noFile')}
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

            <button type="button" className={styles.addBtn} onClick={addBlock}>
                {t('addBlock')}
            </button>

            <div className={styles.actionsRow}>
                <button type="button" className={styles.saveBtn} onClick={onSave}>
                    {t('save')}
                </button>
            </div>
        </div>
    );
}

export function CompanySection({
    company,
    onChange,
    onToast,
    onBusyChange,
    onSaved,
}: {
    company: Company;
    onChange: (next: Company) => void;
    onToast: (t: { type: 'ok' | 'err'; msg: string }) => void;
    onBusyChange: (busy: boolean) => void;
    onSaved: () => void;
}) {
    const t = useTranslations('setting');
    const [pending, setPending] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    function patch(part: Partial<Company>) {
        onChange({ ...company, ...part });
    }

    function onPick(e: ChangeEvent<HTMLInputElement>) {
        setPending(e.target.files?.[0] ?? null);
    }

    async function onUploadLogo() {
        if (!pending) return;
        setUploading(true);
        onBusyChange(true);
        try {
            const fd = new FormData();
            fd.append('file', pending);
            const res = await fetch('/api/upload/logo', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                onToast({ type: 'err', msg: data.error ?? t('toastUploadFail') });
                return;
            }
            patch({ logo: data.logo });
            setPending(null);
            if (inputRef.current) inputRef.current.value = '';
            onToast({ type: 'ok', msg: t('toastLogoUpdated') });
        } catch {
            onToast({ type: 'err', msg: t('toastNetwork') });
        } finally {
            setUploading(false);
            onBusyChange(false);
        }
    }

    function updateHotline(id: string, part: Partial<{ label: string; number: string }>) {
        patch({
            hotlines: company.hotlines.map((h) => (h.id === id ? { ...h, ...part } : h)),
        });
    }
    function addHotline() {
        patch({
            hotlines: [
                ...company.hotlines,
                {
                    id: `hotline-${Date.now()}`,
                    label: `Hotline ${company.hotlines.length + 1}`,
                    number: '',
                },
            ],
        });
    }
    function removeHotline(id: string) {
        patch({ hotlines: company.hotlines.filter((h) => h.id !== id) });
    }

    async function onSave() {
        if (!company.name || !company.shortName) {
            onToast({ type: 'err', msg: t('errNameRequired') });
            return;
        }
        if (!company.hq || !company.office) {
            onToast({ type: 'err', msg: t('errAddressRequired') });
            return;
        }
        if (!EMAIL_RE.test(company.email)) {
            onToast({ type: 'err', msg: t('errEmailInvalid') });
            return;
        }
        onBusyChange(true);
        try {
            const res = await fetch('/api/settings/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                onToast({ type: 'err', msg: data.error ?? t('toastSaveFail') });
                return;
            }
            onToast({ type: 'ok', msg: t('toastSaved') });
            onSaved();
        } catch {
            onToast({ type: 'err', msg: t('toastNetwork') });
        } finally {
            onBusyChange(false);
        }
    }

    return (
        <div className={styles.section}>
            <div className={styles.blockCard}>
                <h3 className={styles.subTitle}>{t('companyLogo')}</h3>
                <div className={styles.logoRow}>
                    <div
                        className={`${styles.logoBox} ${
                            company.logoStyle.mode === 'full'
                                ? styles.logoBoxFull
                                : ''
                        }`}
                        style={logoBoxStyle(company.logoStyle)}
                    >
                        {company.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={company.logo}
                                alt="logo preview"
                                style={logoImgStyle(company.logoStyle)}
                            />
                        ) : (
                            <span>{t('noLogo')}</span>
                        )}
                    </div>
                    <div className={styles.logoActions}>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                            onChange={onPick}
                            className={styles.fileInput}
                            id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className={styles.fileLabel}>
                            {t('pickImage')}
                        </label>
                        <span className={styles.fileName}>
                            {pending ? pending.name : t('noFile')}
                        </span>
                        <button
                            type="button"
                            className={styles.uploadBtn}
                            onClick={onUploadLogo}
                            disabled={!pending || uploading}
                        >
                            {uploading ? t('uploading') : t('upload')}
                        </button>
                    </div>
                </div>
                <label className={styles.field}>
                    <span className={styles.label}>{t('fieldLogoUrl')}</span>
                    <input
                        type="text"
                        className={styles.input}
                        value={company.logo}
                        onChange={(e) => patch({ logo: e.target.value })}
                        placeholder="/uploads/logo-xxx.png"
                    />
                </label>

                <div className={styles.subGroup}>
                    <h4 className={styles.subGroupTitle}>{t('logoFooterTitle')}</h4>
                    <LogoStyleControls
                        style={company.logoStyle}
                        onChange={(next) => patch({ logoStyle: next })}
                        labels={{
                            mode: t('fieldLogoMode'),
                            objectFit: t('fieldLogoObjectFit'),
                            width: t('fieldLogoWidth'),
                            height: t('fieldLogoHeight'),
                            radius: t('fieldLogoRadius'),
                            padding: t('fieldLogoPadding'),
                            bg: t('fieldLogoBg'),
                            modeContained: t('logoModeContained'),
                            modeFull: t('logoModeFull'),
                            modeCover: t('logoModeCover'),
                            fitContain: t('objectFitContain'),
                            fitCover: t('objectFitCover'),
                            fitFill: t('objectFitFill'),
                            fitNone: t('objectFitNone'),
                            fitScaleDown: t('objectFitScaleDown'),
                        }}
                    />
                </div>
            </div>

            <div className={styles.blockCard}>
                <h3 className={styles.subTitle}>{t('companyBrand')}</h3>
                <div className={styles.fields}>
                    <label className={styles.field}>
                        <span className={styles.label}>{t('fieldName')}</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={company.name}
                            onChange={(e) => patch({ name: e.target.value })}
                        />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.label}>{t('fieldShortName')}</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={company.shortName}
                            onChange={(e) => patch({ shortName: e.target.value })}
                        />
                    </label>
                </div>
            </div>

            <div className={styles.blockCard}>
                <h3 className={styles.subTitle}>{t('companyAddress')}</h3>
                <div className={styles.fields}>
                    <label className={styles.field}>
                        <span className={styles.label}>{t('fieldHq')}</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={company.hq}
                            onChange={(e) => patch({ hq: e.target.value })}
                        />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.label}>{t('fieldOffice')}</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={company.office}
                            onChange={(e) => patch({ office: e.target.value })}
                        />
                    </label>
                </div>
            </div>

            <div className={styles.blockCard}>
                <h3 className={styles.subTitle}>{t('companyContact')}</h3>
                <div className={styles.fields}>
                    <div className={styles.fieldRow}>
                        <label className={`${styles.field} ${styles.flex1}`}>
                            <span className={styles.label}>{t('fieldWebsiteLabel')}</span>
                            <input
                                type="text"
                                className={styles.input}
                                value={company.websiteLabel}
                                onChange={(e) => patch({ websiteLabel: e.target.value })}
                            />
                        </label>
                        <label className={`${styles.field} ${styles.flex1}`}>
                            <span className={styles.label}>{t('fieldWebsiteUrl')}</span>
                            <input
                                type="text"
                                className={styles.input}
                                value={company.websiteUrl}
                                onChange={(e) => patch({ websiteUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </label>
                    </div>
                    <div className={styles.fieldRow}>
                        <label className={`${styles.field} ${styles.flex1}`}>
                            <span className={styles.label}>{t('fieldFanpageLabel')}</span>
                            <input
                                type="text"
                                className={styles.input}
                                value={company.fanpageLabel}
                                onChange={(e) => patch({ fanpageLabel: e.target.value })}
                            />
                        </label>
                        <label className={`${styles.field} ${styles.flex1}`}>
                            <span className={styles.label}>{t('fieldFanpageUrl')}</span>
                            <input
                                type="text"
                                className={styles.input}
                                value={company.fanpageUrl}
                                onChange={(e) => patch({ fanpageUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </label>
                    </div>
                    <label className={styles.field}>
                        <span className={styles.label}>{t('fieldEmail')}</span>
                        <input
                            type="email"
                            className={styles.input}
                            value={company.email}
                            onChange={(e) => patch({ email: e.target.value })}
                        />
                    </label>
                </div>
            </div>

            <div className={styles.blockCard}>
                <h3 className={styles.subTitle}>{t('companyHotlines')}</h3>
                <div className={styles.list}>
                    {company.hotlines.map((h, idx) => (
                        <div key={h.id} className={styles.listItem}>
                            <span className={styles.listIndex}>#{idx + 1}</span>
                            <input
                                type="text"
                                className={styles.input}
                                value={h.label}
                                onChange={(e) =>
                                    updateHotline(h.id, { label: e.target.value })
                                }
                                placeholder={t('hotlineLabelPh')}
                            />
                            <input
                                type="text"
                                className={styles.input}
                                value={h.number}
                                onChange={(e) =>
                                    updateHotline(h.id, { number: e.target.value })
                                }
                                placeholder={t('hotlineNumberPh')}
                            />
                            <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                onClick={() => removeHotline(h.id)}
                                aria-label={t('remove')}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
                <button type="button" className={styles.addBtn} onClick={addHotline}>
                    {t('addHotline')}
                </button>
            </div>

            <div className={styles.actionsRow}>
                <button type="button" className={styles.saveBtn} onClick={onSave}>
                    {t('save')}
                </button>
            </div>
        </div>
    );
}

export function NavbarLogoSection({
    navLogo,
    fallbackLogo,
    navLogoStyle,
    onChange,
    onNavLogoUrlChanged,
    onToast,
    onBusyChange,
    onSaved,
}: {
    navLogo: string;
    fallbackLogo: string;
    navLogoStyle: LogoStyle;
    onChange: (next: LogoStyle) => void;
    onNavLogoUrlChanged: (url: string) => void;
    onToast: (t: { type: 'ok' | 'err'; msg: string }) => void;
    onBusyChange: (busy: boolean) => void;
    onSaved: () => void;
}) {
    const tr = useTranslations('setting');
    const [pending, setPending] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    function onPick(e: ChangeEvent<HTMLInputElement>) {
        setPending(e.target.files?.[0] ?? null);
    }

    async function onUploadLogo() {
        if (!pending) return;
        setUploading(true);
        onBusyChange(true);
        try {
            const fd = new FormData();
            fd.append('file', pending);
            fd.append('target', 'navLogo');
            const res = await fetch('/api/upload/logo', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                onToast({ type: 'err', msg: data.error ?? tr('toastUploadFail') });
                return;
            }
            onNavLogoUrlChanged(data.navLogo);
            setPending(null);
            if (inputRef.current) inputRef.current.value = '';
            onToast({ type: 'ok', msg: tr('toastLogoUpdated') });
        } catch {
            onToast({ type: 'err', msg: tr('toastNetwork') });
        } finally {
            setUploading(false);
            onBusyChange(false);
        }
    }

    return (
        <div className={styles.section}>
            <div className={styles.blockCard}>
                <h3 className={styles.subTitle}>{tr('companyLogo')}</h3>
                <div className={styles.logoRow}>
                    <div
                        className={`${styles.logoBox} ${
                            navLogoStyle.mode === 'full' ? styles.logoBoxFull : ''
                        }`}
                        style={logoBoxStyle(navLogoStyle)}
                    >
                        {navLogo || fallbackLogo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={navLogo || fallbackLogo}
                                alt="navbar logo preview"
                                style={logoImgStyle(navLogoStyle)}
                            />
                        ) : (
                            <span>{tr('noLogo')}</span>
                        )}
                    </div>
                    <div className={styles.logoActions}>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                            onChange={onPick}
                            className={styles.fileInput}
                            id="nav-logo-upload"
                        />
                        <label htmlFor="nav-logo-upload" className={styles.fileLabel}>
                            {tr('pickImage')}
                        </label>
                        <span className={styles.fileName}>
                            {pending ? pending.name : tr('noFile')}
                        </span>
                        <button
                            type="button"
                            className={styles.uploadBtn}
                            onClick={onUploadLogo}
                            disabled={!pending || uploading}
                        >
                            {uploading ? tr('uploading') : tr('upload')}
                        </button>
                    </div>
                </div>
                <p className={styles.subGroupHint}>{tr('logoNavHint')}</p>

                <LogoStyleControls
                    style={navLogoStyle}
                    onChange={onChange}
                    labels={{
                        mode: tr('fieldLogoMode'),
                        objectFit: tr('fieldLogoObjectFit'),
                        width: tr('fieldLogoWidth'),
                        height: tr('fieldLogoHeight'),
                        radius: tr('fieldLogoRadius'),
                        padding: tr('fieldLogoPadding'),
                        bg: tr('fieldLogoBg'),
                        modeContained: tr('logoModeContained'),
                        modeFull: tr('logoModeFull'),
                        modeCover: tr('logoModeCover'),
                        fitContain: tr('objectFitContain'),
                        fitCover: tr('objectFitCover'),
                        fitFill: tr('objectFitFill'),
                        fitNone: tr('objectFitNone'),
                        fitScaleDown: tr('objectFitScaleDown'),
                    }}
                />
            </div>

            <div className={styles.actionsRow}>
                <button type="button" className={styles.saveBtn} onClick={onSaved}>
                    {tr('save')}
                </button>
            </div>
        </div>
    );
}

export function LinkListSection({
    sectionKey,
    items,
    onChange,
    onToast,
    onBusyChange,
    onSaved,
}: {
    sectionKey: 'services' | 'quickLinks' | 'nav';
    items: LinkItem[];
    onChange: (next: LinkItem[]) => void;
    onToast: (t: { type: 'ok' | 'err'; msg: string }) => void;
    onBusyChange: (busy: boolean) => void;
    onSaved: () => void;
}) {
    const t = useTranslations('setting');
    const prefix = sectionKey === 'services' ? 'svc' : sectionKey === 'quickLinks' ? 'ql' : 'nav';

    function update(id: string, part: Partial<LinkItem>) {
        onChange(items.map((i) => (i.id === id ? { ...i, ...part } : i)));
    }
    function add() {
        onChange([
            ...items,
            { id: `${prefix}-${Date.now()}`, label: '', href: '/' },
        ]);
    }
    function remove(id: string) {
        onChange(items.filter((i) => i.id !== id));
    }
    function move(id: string, dir: -1 | 1) {
        const idx = items.findIndex((i) => i.id === id);
        if (idx < 0) return;
        const nextIdx = idx + dir;
        if (nextIdx < 0 || nextIdx >= items.length) return;
        const next = items.slice();
        const [item] = next.splice(idx, 1);
        next.splice(nextIdx, 0, item);
        onChange(next);
    }

    async function onSave() {
        for (const it of items) {
            if (!it.label.trim() || !it.href.trim()) {
                onToast({ type: 'err', msg: t('errItemRequired') });
                return;
            }
            if (!VALID_HREF_PREFIX.test(it.href)) {
                onToast({ type: 'err', msg: t('errHrefInvalid') });
                return;
            }
        }
        onBusyChange(true);
        try {
            const res = await fetch(`/api/settings/${sectionKey}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                onToast({ type: 'err', msg: data.error ?? t('toastSaveFail') });
                return;
            }
            onToast({ type: 'ok', msg: t('toastSaved') });
            onSaved();
        } catch {
            onToast({ type: 'err', msg: t('toastNetwork') });
        } finally {
            onBusyChange(false);
        }
    }

    return (
        <div className={styles.section}>
            <div className={styles.list}>
                {items.map((it, idx) => (
                    <div key={it.id} className={styles.listItem}>
                        <span className={styles.listIndex}>#{idx + 1}</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={it.label}
                            onChange={(e) => update(it.id, { label: e.target.value })}
                            placeholder={t('itemLabelPh')}
                        />
                        <input
                            type="text"
                            className={styles.input}
                            value={it.href}
                            onChange={(e) => update(it.id, { href: e.target.value })}
                            placeholder={t('itemHrefPh')}
                        />
                        <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => move(it.id, -1)}
                            disabled={idx === 0}
                            aria-label={t('moveUp')}
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => move(it.id, 1)}
                            disabled={idx === items.length - 1}
                            aria-label={t('moveDown')}
                        >
                            ↓
                        </button>
                        <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => remove(it.id)}
                            aria-label={t('remove')}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" className={styles.addBtn} onClick={add}>
                {t('addItem')}
            </button>
            <div className={styles.actionsRow}>
                <button type="button" className={styles.saveBtn} onClick={onSave}>
                    {t('save')}
                </button>
            </div>
        </div>
    );
}
