import assert from 'node:assert/strict';
import test from 'node:test';

const elements = new Map();
const heading = { dataset: { i18n: 'popupTitle' }, textContent: 'Sui 余额' };
globalThis.document = {
  querySelector(selector) {
    if (!elements.has(selector)) {
      elements.set(selector, {
        value: '',
        hidden: false,
        textContent: '',
        classList: { add() {}, remove() {} },
        addEventListener() {},
        replaceChildren() {},
      });
    }
    return elements.get(selector);
  },
  querySelectorAll() { return [heading]; },
  documentElement: { lang: 'zh-CN' },
};
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error('Unexpected balance request');
};
globalThis.chrome = {
  tabs: { query: async () => [{ url: 'https://example.com/' }] },
  i18n: { getMessage: (key) => ({ popupTitle: 'Sui Balances', switchToSuiscan: 'Open a Suiscan account or object page, or enter a Sui address or object ID' })[key] ?? '' },
  storage: { local: { get: async () => ({ suiId: '0xa6877ac19035d178a0d843385636993e14100b9ef330606556f2fed6dc0e4328' }), set: async () => {} } },
};

await import('../popup.mjs');

test('unrelated pages open with an empty ID and guidance instead of querying a saved Vault', () => {
  assert.equal(elements.get('#sui-id').value, '');
  assert.equal(elements.get('#status').textContent, 'Open a Suiscan account or object page, or enter a Sui address or object ID');
  assert.equal(heading.textContent, 'Sui Balances');
  assert.equal(elements.get('#address-section').hidden, true);
  assert.equal(fetchCalls, 0);
});
