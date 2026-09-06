import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../script.js', import.meta.url), 'utf8');
const fn = source.slice(source.indexOf('async function loadBouquetDay()'), source.indexOf('\nloadBouquetDay();'));
for (const failure of [null, 'network', 'decode']) {
    test(`client publishes photo and price atomically: ${failure || 'success'}`, async () => {
        const elements = Object.fromEntries(['Title', 'Price', 'OldPrice', 'Discount', 'Image', 'Link'].map(name => [`bouquetDay${name}`, { textContent: 'original', id: `bouquetDay${name}` }]));
        let replaced = false;
        const tag = { textContent: 'our work' };
        elements.bouquetDayCard = { querySelector: () => tag, classList: { add() {} } };
        elements.bouquetDayImage.replaceWith = () => {
            assert.equal(elements.bouquetDayPrice.textContent, 'original');
            replaced = true;
        };
        class Image {
            set src(value) { if (value) queueMicrotask(() => failure === 'network' ? this.onerror() : this.onload()); }
            async decode() { if (failure === 'decode') throw new Error('corrupt'); }
        }
        const context = vm.createContext({ Image, document: { getElementById: id => elements[id] }, setTimeout, clearTimeout, AbortSignal, console: { info() {} }, fetch: async () => ({ ok: true, json: async () => ({ bouquet: { title: 'New', price: '2555 ₽', photoUrl: '/new.webp', sourcePostUrl: 'https://t.me/vetka_2024/1858' } }) }) });
        await vm.runInContext(`${fn}; loadBouquetDay()`, context);
        assert.equal(replaced, !failure);
        assert.equal(elements.bouquetDayTitle.textContent, failure ? 'original' : 'New');
        if (failure) assert.equal(elements.bouquetDayPrice.textContent, 'original');
        else assert.match(elements.bouquetDayPrice.textContent, /2\s555 ₽/);
    });
}
