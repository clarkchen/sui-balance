import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('English and Chinese catalogs cover the same extension messages', async () => {
  const en = JSON.parse(await readFile(new URL('../_locales/en/messages.json', import.meta.url)));
  const zh = JSON.parse(await readFile(new URL('../_locales/zh_CN/messages.json', import.meta.url)));
  const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url)));
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zh).sort());
  assert.equal(manifest.default_locale, 'en');
  assert.equal(manifest.action.default_title, '__MSG_actionTitle__');
  for (const catalog of [en, zh]) {
    for (const entry of Object.values(catalog)) assert.ok(entry.message);
  }
});
