import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { BouquetSnapshot } from '../lib/bouquet-snapshot.js';

test('publish complete snapshot, survive failed updates and restart, reject older posts', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'vetka-snapshot-test-'));
    let id = 1;
    let broken = false;
    let corrupt = false;
    let calls = 0;
    const jpeg = await sharp({ create: { width: 30, height: 30, channels: 3, background: '#dcaaff' } }).jpeg().toBuffer();
    const fetcher = async url => {
        calls++;
        if (url.endsWith('/api/bouquet-day')) return Response.json({ ok: true, bouquet: {
            title: `Композиция ${id}`, price: `${id}000 ₽`, photoUrl: '/api/telegram-photo?file_id=test', sourcePostUrl: `https://t.me/vetka_2024/${id}`,
        } });
        if (broken) throw new Error('network_error');
        return new Response(corrupt ? 'not a photo' : jpeg, { headers: { 'Content-Type': 'image/jpeg' } });
    };
    const transformImage = bytes => sharp(bytes).webp().toBuffer();
    const store = new BouquetSnapshot({ directory, fetcher, transformImage });
    try {
        await store.init();
        assert.equal(store.getBouquet(), null);
        await Promise.all([store.refresh(), store.refresh()]);
        assert.equal(calls, 2, 'concurrent refreshes share one request');
        const first = store.getBouquet();
        assert.equal(first.price, '1000 ₽');
        assert.match(first.photoUrl, /^\/media\/bouquet-day\/[a-f0-9]{64}\.webp$/);
        id = 2;
        broken = true;
        await assert.rejects(store.refresh());
        assert.deepEqual(store.getBouquet(), first, 'photo failure must not publish new price');
        broken = false;
        corrupt = true;
        await assert.rejects(store.refresh());
        assert.deepEqual(store.getBouquet(), first, 'corrupt image must not publish new price');
        corrupt = false;
        await store.refresh();
        assert.equal(store.getBouquet().price, '2000 ₽');
        const restarted = new BouquetSnapshot({ directory, fetcher, transformImage });
        await restarted.init();
        assert.deepEqual(restarted.getBouquet(), store.getBouquet());
        id = 1;
        await assert.rejects(restarted.refresh(), /out_of_order/);
        restarted.lastSuccess = Date.now() - 86400001;
        assert.equal(restarted.getBouquet(), null, 'hide unverified offer after prolonged outage');
        id = 2;
        await writeFile(path.join(directory, 'photos', restarted.current.filename), 'corrupt');
        const repaired = new BouquetSnapshot({ directory, fetcher, transformImage });
        await repaired.init();
        assert.equal(repaired.getBouquet(), null, 'do not restore a corrupt photo after restart');
        await repaired.refresh();
        assert.equal(repaired.getBouquet().price, '2000 ₽');
        const healthy = new BouquetSnapshot({ directory, fetcher, transformImage });
        await healthy.init();
        assert.equal(healthy.getBouquet().price, '2000 ₽', 'repair corrupt stored photo atomically');
    } finally { await rm(directory, { recursive: true, force: true }); }
});
