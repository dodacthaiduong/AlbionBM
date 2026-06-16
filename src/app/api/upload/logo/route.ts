import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getSettings, updateCompany } from '@/lib/settings';
import { jsonError, jsonOk, requireAuth } from '@/lib/api';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function extFromMime(mime: string): string {
    switch (mime) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/webp':
            return '.webp';
        case 'image/gif':
            return '.gif';
        case 'image/svg+xml':
            return '.svg';
        default:
            return '';
    }
}

export async function POST(request: Request) {
    if (!(await requireAuth())) {
        return jsonError('Unauthorized', 401);
    }
    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return jsonError('Invalid form data');
    }
    const file = form.get('file');
    if (!(file instanceof File)) {
        return jsonError('No file uploaded');
    }
    if (file.size > MAX_BYTES) {
        return jsonError('File too large (max 8MB)', 413);
    }
    if (!ALLOWED.has(file.type)) {
        return jsonError('Unsupported file type', 415);
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = extFromMime(file.type);
    const filename = `logo-${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;
    const target = form.get('target');
    const field = target === 'navLogo' ? 'navLogo' : 'logo';

    const settings = await getSettings();
    const next = await updateCompany({ ...settings.company, [field]: url });

    return jsonOk({ [field]: next.company[field] });
}
