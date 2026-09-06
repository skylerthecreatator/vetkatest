import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Only background work contacts the upstream. Visitors read an atomic local snapshot.
export class BouquetSnapshot {
    constructor({ directory, origin = 'https://vetkatest.vercel.app', fetcher = fetch, transformImage = async bytes => bytes }) {
        this.directory = directory;
        this.origin = origin;
        this.fetcher = fetcher;
        this.transformImage = transformImage;
        this.current = null;
        this.pending = null;
        this.lastSuccess = 0;
        this.lastError = null;
    }

    async init() {
        await mkdir(path.join(this.directory, 'photos'), { recursive: true });
        try {
            const saved = JSON.parse(await readFile(path.join(this.directory, 'current.json'), 'utf8'));
            if (!/^[a-f0-9]{64}\.webp$/.test(saved.filename)) throw new Error('invalid_snapshot');
            const photo = await readFile(path.join(this.directory, 'photos', saved.filename));
            if (`${createHash('sha256').update(photo).digest('hex')}.webp` !== saved.filename) throw new Error('corrupt_snapshot_photo');
            this.current = saved;
            this.lastSuccess = saved.checkedAt || 0;
        } catch { /* A missing or corrupt snapshot is never shown as a live offer. */ }
    }

    getBouquet() {
        if (!this.current || Date.now() - this.lastSuccess > 86400000) return null;
        return this.current.bouquet;
    }

    refresh() {
        if (this.pending) return this.pending;
        this.pending = this.refreshOnce().catch(error => {
            this.lastError = error.name === 'TimeoutError' ? 'upstream_timeout' : 'sync_failed';
            throw error;
        }).finally(() => { this.pending = null; });
        return this.pending;
    }

    async refreshOnce() {
        const response = await this.fetcher(`${this.origin}/api/bouquet-day`, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('upstream_unavailable');
        const payload = await response.json();
        const candidate = payload?.bouquet;
        if (!payload.ok || !candidate?.title || !candidate.photoUrl || !/^https:\/\/t\.me\/vetka_2024\/\d+$/.test(candidate.sourcePostUrl || '')) throw new Error('invalid_bouquet');
        const oldId = Number(this.current?.bouquet.sourcePostUrl.split('/').at(-1) || 0);
        const newId = Number(candidate.sourcePostUrl.split('/').at(-1));
        if (newId < oldId) throw new Error('out_of_order_bouquet');
        const photo = new URL(candidate.photoUrl, this.origin);
        if (photo.origin !== new URL(this.origin).origin || photo.pathname !== '/api/telegram-photo') throw new Error('invalid_photo_url');
        const photoResponse = await this.fetcher(photo.href, { signal: AbortSignal.timeout(20000) });
        if (!photoResponse.ok || !/^image\/(jpeg|png|webp)/i.test(photoResponse.headers.get('content-type') || '')) throw new Error('photo_unavailable');
        const chunks = [];
        let length = 0;
        for await (const chunk of photoResponse.body) {
            length += chunk.length;
            if (length > 10 * 1024 * 1024) throw new Error('photo_too_large');
            chunks.push(chunk);
        }
        if (!length) throw new Error('empty_photo');
        // Decode and re-encode before publishing; a 200 response with corrupt bytes
        // must not attach a new price to the previous image.
        const bytes = await this.transformImage(Buffer.concat(chunks));
        const filename = `${createHash('sha256').update(bytes).digest('hex')}.webp`;
        // Published content-addressed files are immutable: never truncate one while
        // a visitor may be reading it during a background recheck.
        try {
            await writeFile(path.join(this.directory, 'photos', filename), bytes, { flag: 'wx' });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
            const existing = await readFile(path.join(this.directory, 'photos', filename));
            if (!existing.equals(bytes)) {
                const repairPath = path.join(this.directory, 'photos', `${filename}.tmp`);
                await writeFile(repairPath, bytes);
                await rename(repairPath, path.join(this.directory, 'photos', filename));
            }
        }
        const bouquet = {
            title: String(candidate.title).slice(0, 120),
            description: String(candidate.description || '').slice(0, 500),
            price: String(candidate.price || '').slice(0, 60),
            oldPrice: String(candidate.oldPrice || '').slice(0, 60),
            discountPercent: Number(candidate.discountPercent) || null,
            sourcePostUrl: candidate.sourcePostUrl,
            publishedAt: candidate.publishedAt || null,
            photoUrl: `/media/bouquet-day/${filename}`,
        };
        const next = { bouquet, filename, checkedAt: Date.now() };
        await writeFile(path.join(this.directory, 'current.json.tmp'), JSON.stringify(next));
        await rename(path.join(this.directory, 'current.json.tmp'), path.join(this.directory, 'current.json'));
        this.current = next;
        this.lastSuccess = next.checkedAt;
        this.lastError = null;
        return bouquet;
    }

    start(interval = 120000) {
        const sync = () => this.refresh().catch(() => console.warn('Bouquet sync failed; keeping last complete snapshot'));
        void sync();
        this.timer = setInterval(sync, interval);
        this.timer.unref();
    }
}
