const ENDPOINT = 'https://graphql.mainnet.sui.io/graphql';
const ADDRESS_PATTERN = /^0x[0-9a-f]{64}$/i;
const ADDRESS_QUERY = `query AddressBalances($id: SuiAddress!, $after: String) {
  address(address: $id) {
    balances(first: 50, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        coinType { repr }
        totalBalance
      }
    }
  }
}`;
const FIELDS_QUERY = `query VaultFields($id: SuiAddress!, $after: String) {
  object(address: $id) {
    dynamicFields(first: 50, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name { type { repr } }
        value { ... on MoveValue { json } }
      }
    }
  }
}`;
const METADATA_QUERY = `query CoinInfo($coinType: String!) {
  coinMetadata(coinType: $coinType) { decimals symbol }
}`;

const t = (key, fallback) => globalThis.chrome?.i18n?.getMessage(key) || fallback;

export function normalizeSuiId(id) {
  const trimmed = String(id ?? '').trim();
  if (!ADDRESS_PATTERN.test(trimmed)) {
    throw new Error(t('invalidSuiId', '请输入 0x 开头的 64 位 Sui 地址或对象 ID'));
  }
  return trimmed.toLowerCase();
}

export function extractSuiIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'suiscan.xyz') return null;
    const match = parsed.pathname.match(/^\/mainnet\/(?:object|account)\/(0x[0-9a-f]{64})(?:\/|$)/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

export function parseBalanceFields(nodes) {
  const balances = [];
  for (const node of nodes) {
    const repr = node?.name?.type?.repr ?? '';
    const match = repr.match(/::vault::BalanceKey<(.+)>$/);
    if (!match) continue;
    const rawAmount = node?.value?.json;
    if (typeof rawAmount !== 'string' || !/^\d+$/.test(rawAmount)) {
      throw new Error(`${t('unparseableBalancePrefix', '余额字段无法解析：')}${match[1]}`);
    }
    balances.push({ coinType: match[1], rawAmount });
  }
  return balances;
}

export function formatUnits(rawAmount, decimals) {
  if (!/^\d+$/.test(rawAmount) || !Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new Error(t('invalidBalanceDecimals', '币种余额或精度无效'));
  }
  const base = 10n ** BigInt(decimals);
  const value = BigInt(rawAmount);
  const whole = (value / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decimals === 0) return whole;
  const fraction = (value % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

export async function postGraphql(query, variables) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${t('requestFailedHttpPrefix', 'Sui 查询失败：HTTP ')}${response.status}`);
  const body = await response.json();
  if (body.errors?.length) throw new Error(body.errors[0].message || t('requestReturnedError', 'Sui 查询返回错误'));
  if (!body.data) throw new Error(t('requestNoData', 'Sui 查询没有返回数据'));
  return body.data;
}

async function withMetadata(entries, request) {
  const results = [];
  for (let i = 0; i < entries.length; i += 3) {
    const batch = entries.slice(i, i + 3);
    const metadataResults = await Promise.allSettled(batch.map(({ coinType }) =>
      request(METADATA_QUERY, { coinType })));
    for (let j = 0; j < batch.length; j += 1) {
      const { coinType, rawAmount } = batch[j];
      const result = metadataResults[j];
      const metadata = result.status === 'fulfilled' ? result.value?.coinMetadata : null;
      const decimals = metadata?.decimals;
      results.push({
        coinType,
        rawAmount,
        amount: Number.isInteger(decimals) && decimals >= 0 && decimals <= 255
          ? formatUnits(rawAmount, decimals)
          : null,
        symbol: metadata?.symbol || coinType.split('::').at(-1),
      });
    }
  }
  return results;
}

export async function fetchAddressBalances(suiId, request = postGraphql) {
  const id = normalizeSuiId(suiId);
  const balances = [];
  const seenCursors = new Set();
  let after = null;
  for (let page = 0; page < 100; page += 1) {
    const result = await request(ADDRESS_QUERY, { id, after });
    if (result?.address === null) return [];
    const connection = result?.address?.balances;
    if (!connection) throw new Error(t('missingAddressBalances', '找不到地址余额'));
    for (const node of connection.nodes ?? []) {
      const coinType = node?.coinType?.repr;
      const rawAmount = node?.totalBalance;
      if (!coinType || typeof rawAmount !== 'string' || !/^\d+$/.test(rawAmount)) {
        throw new Error(t('invalidAddressBalanceField', '地址余额字段无法解析'));
      }
      balances.push({ coinType, rawAmount });
    }
    if (!connection.pageInfo?.hasNextPage) return withMetadata(balances, request);
    const cursor = connection.pageInfo.endCursor;
    if (!cursor || seenCursors.has(cursor)) throw new Error(t('addressBalancePagination', '地址余额分页异常'));
    seenCursors.add(cursor);
    after = cursor;
  }
  throw new Error(t('addressBalanceLimit', '地址余额超过 100 页'));
}

export async function fetchVaultBalances(vaultId, request = postGraphql) {
  const id = normalizeSuiId(vaultId);
  const fields = [];
  const seenCursors = new Set();
  let after = null;
  for (let page = 0; page < 100; page += 1) {
    const result = await request(FIELDS_QUERY, { id, after });
    if (result?.object === null) return [];
    const connection = result?.object?.dynamicFields;
    if (!connection) throw new Error(t('missingObjectDynamicFields', '找不到对象或无法读取动态字段'));
    fields.push(...parseBalanceFields(connection.nodes ?? []));
    if (!connection.pageInfo?.hasNextPage) break;
    const cursor = connection.pageInfo.endCursor;
    if (!cursor || seenCursors.has(cursor)) throw new Error(t('dynamicFieldPagination', '动态字段分页异常'));
    seenCursors.add(cursor);
    after = cursor;
    if (page === 99) throw new Error(t('dynamicFieldLimit', '动态字段超过 100 页'));
  }

  return withMetadata(fields, request);
}
