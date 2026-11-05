import assert from 'node:assert/strict';
import test from 'node:test';

const balance = await import('../balance.mjs').catch(() => ({}));

const VAULT = '0xa6877ac19035d178a0d843385636993e14100b9ef330606556f2fed6dc0e4328';
const SUI = '0x2::sui::SUI';
const USDC = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
const PACKAGE = '0xda00b7a91519aa764421569217300672686692fb250c84766e5fec96e8c30ae2';

function field(coinType, amount) {
  return {
    name: { type: { repr: `${PACKAGE}::vault::BalanceKey<${coinType}>` } },
    value: { json: amount },
  };
}

test('extracts a Sui ID from Suiscan account and object URLs', () => {
  assert.equal(typeof balance.extractSuiIdFromUrl, 'function');
  assert.equal(balance.extractSuiIdFromUrl(`https://suiscan.xyz/mainnet/object/${VAULT}/fields`), VAULT);
  assert.equal(balance.extractSuiIdFromUrl(`https://suiscan.xyz/mainnet/account/${VAULT}`), VAULT);
  assert.equal(balance.extractSuiIdFromUrl(`https://evil.example/mainnet/object/${VAULT}`), null);
  assert.equal(balance.extractSuiIdFromUrl('not a url'), null);
});

test('invalid IDs use the browser language', () => {
  globalThis.chrome = { i18n: { getMessage: (key) => key === 'invalidSuiId' ? 'Enter a 0x-prefixed, 64-digit Sui address or object ID' : '' } };
  try {
    assert.throws(() => balance.normalizeSuiId('bad'), /Enter a 0x-prefixed/);
  } finally {
    delete globalThis.chrome;
  }
});

test('reads all wallet coin balances and uses the combined total', async () => {
  assert.equal(typeof balance.fetchAddressBalances, 'function');
  const calls = [];
  const request = async (query, variables) => {
    calls.push({ query, variables });
    if (query.includes('CoinInfo')) {
      return { coinMetadata: variables.coinType === SUI
        ? { decimals: 9, symbol: 'SUI' }
        : { decimals: 6, symbol: 'USDC' } };
    }
    assert.match(query, /AddressBalances/);
    assert.doesNotMatch(query, /coinMetadata/);
    return { address: { balances: {
      pageInfo: variables.after
        ? { hasNextPage: false, endCursor: null }
        : { hasNextPage: true, endCursor: 'next' },
      nodes: variables.after
        ? [{ coinType: { repr: USDC }, totalBalance: '2036699241' }]
        : [{ coinType: { repr: SUI }, coinBalance: '1000000000', addressBalance: '500000000', totalBalance: '1500000000' }],
    } } };
  };
  assert.deepEqual(await balance.fetchAddressBalances(VAULT, request), [
    { coinType: SUI, rawAmount: '1500000000', amount: '1.5', symbol: 'SUI' },
    { coinType: USDC, rawAmount: '2036699241', amount: '2,036.699241', symbol: 'USDC' },
  ]);
  assert.deepEqual(calls.filter((call) => call.query.includes('AddressBalances')).map((call) => call.variables.after), [null, 'next']);
});

test('keeps raw units when wallet coin metadata is missing', async () => {
  assert.equal(typeof balance.fetchAddressBalances, 'function');
  const request = async (query) => query.includes('CoinInfo')
    ? { coinMetadata: null }
    : { address: { balances: {
      pageInfo: { hasNextPage: false },
      nodes: [{ coinType: { repr: SUI }, totalBalance: '123' }],
    } } };
  assert.deepEqual(await balance.fetchAddressBalances(VAULT, request), [
    { coinType: SUI, rawAmount: '123', amount: null, symbol: 'SUI' },
  ]);
});

test('many wallet coins do not put metadata lookups into the balances query', async () => {
  const request = async (query, variables) => {
    if (query.includes('AddressBalances')) {
      if (query.includes('coinMetadata')) throw new Error('RESOURCE_EXHAUSTED');
      return { address: { balances: {
        pageInfo: { hasNextPage: false },
        nodes: Array.from({ length: 12 }, (_, i) => ({
          coinType: { repr: `0x${i.toString(16)}::coin::C${i}` },
          totalBalance: '1000000000',
        })),
      } } };
    }
    return { coinMetadata: { decimals: 9, symbol: variables.coinType.split('::').at(-1) } };
  };
  const result = await balance.fetchAddressBalances(VAULT, request);
  assert.equal(result.length, 12);
  assert.equal(result[11].amount, '1');
});

test('one metadata failure keeps the wallet balance in raw units', async () => {
  const request = async (query) => {
    if (query.includes('CoinInfo')) throw new Error('metadata unavailable');
    return { address: { balances: {
      pageInfo: { hasNextPage: false },
      nodes: [{ coinType: { repr: SUI }, totalBalance: '123' }],
    } } };
  };
  assert.deepEqual(await balance.fetchAddressBalances(VAULT, request), [
    { coinType: SUI, rawAmount: '123', amount: null, symbol: 'SUI' },
  ]);
});

test('an unused Sui address has zero listed balances', async () => {
  const request = async () => ({ address: null });
  assert.deepEqual(await balance.fetchAddressBalances(VAULT, request), []);
});

test('parses only BalanceKey dynamic fields', () => {
  assert.equal(typeof balance.parseBalanceFields, 'function');
  const nodes = [
    { name: { type: { repr: `${PACKAGE}::vault::PoolKey` } }, value: { json: true } },
    field(SUI, '10785600000'),
    field(USDC, '2036699241'),
  ];
  assert.deepEqual(balance.parseBalanceFields(nodes), [
    { coinType: SUI, rawAmount: '10785600000' },
    { coinType: USDC, rawAmount: '2036699241' },
  ]);
});

test('formats base units exactly without floating point rounding', () => {
  assert.equal(typeof balance.formatUnits, 'function');
  assert.equal(balance.formatUnits('10785600000', 9), '10.7856');
  assert.equal(balance.formatUnits('2036699241', 6), '2,036.699241');
  assert.equal(balance.formatUnits('1', 9), '0.000000001');
  assert.equal(balance.formatUnits('0', 6), '0');
});

test('loads every dynamic field page and coin metadata', async () => {
  assert.equal(typeof balance.fetchVaultBalances, 'function');
  const calls = [];
  const request = async (query, variables) => {
    calls.push({ query, variables });
    if (query.includes('VaultFields')) {
      return { object: { dynamicFields: {
        pageInfo: calls.filter((call) => call.query.includes('VaultFields')).length === 1
          ? { hasNextPage: true, endCursor: 'next' }
          : { hasNextPage: false, endCursor: null },
        nodes: variables.after ? [field(USDC, '2036699241')] : [field(SUI, '10785600000')],
      } } };
    }
    return { coinMetadata: variables.coinType === SUI
      ? { decimals: 9, symbol: 'SUI' }
      : { decimals: 6, symbol: 'USDC' } };
  };
  const result = await balance.fetchVaultBalances(VAULT, request);
  assert.deepEqual(result, [
    { coinType: SUI, rawAmount: '10785600000', amount: '10.7856', symbol: 'SUI' },
    { coinType: USDC, rawAmount: '2036699241', amount: '2,036.699241', symbol: 'USDC' },
  ]);
  assert.deepEqual(calls.filter((call) => call.query.includes('VaultFields')).map((call) => call.variables.after), [null, 'next']);
});

test('does not guess decimals when metadata is unavailable', async () => {
  assert.equal(typeof balance.fetchVaultBalances, 'function');
  const request = async (query) => query.includes('VaultFields')
    ? { object: { dynamicFields: { pageInfo: { hasNextPage: false }, nodes: [field(SUI, '123')] } } }
    : { coinMetadata: null };
  assert.deepEqual(await balance.fetchVaultBalances(VAULT, request), [
    { coinType: SUI, rawAmount: '123', amount: null, symbol: 'SUI' },
  ]);
});

test('wallet address without an object has no internal balance fields', async () => {
  const request = async () => ({ object: null });
  assert.deepEqual(await balance.fetchVaultBalances(VAULT, request), []);
});
