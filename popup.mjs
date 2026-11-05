import { extractSuiIdFromUrl, fetchAddressBalances, fetchVaultBalances, normalizeSuiId } from './balance.mjs';

const t = (key) => chrome.i18n.getMessage(key) || key;
document.documentElement.lang = (chrome.i18n.getMessage('@@ui_locale') || 'en').replace('_', '-');
for (const element of document.querySelectorAll('[data-i18n]')) {
  element.textContent = t(element.dataset.i18n);
}

const form = document.querySelector('#balance-form');
const input = document.querySelector('#sui-id');
const button = document.querySelector('#refresh');
const status = document.querySelector('#status');
const addressSection = document.querySelector('#address-section');
const addressBalances = document.querySelector('#address-balances');
const addressEmpty = document.querySelector('#address-empty');
const vaultSection = document.querySelector('#vault-section');
const vaultBalances = document.querySelector('#vault-balances');
const updated = document.querySelector('#updated');
const explorerLink = document.querySelector('#explorer-link');

function showBalances(container, items) {
  container.replaceChildren();
  const symbolCounts = new Map();
  for (const item of items) symbolCounts.set(item.symbol, (symbolCounts.get(item.symbol) ?? 0) + 1);
  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'balance';
    const coin = document.createElement('span');
    coin.className = 'coin';
    coin.textContent = item.symbol;
    coin.title = item.coinType;
    if (symbolCounts.get(item.symbol) > 1) {
      const coinType = document.createElement('small');
      const packageId = item.coinType.split('::')[0];
      coinType.className = 'coin-type';
      coinType.textContent = `${packageId.slice(0, 8)}…${packageId.slice(-4)}`;
      coin.append(coinType);
    }
    const amount = document.createElement('span');
    amount.className = 'amount';
    amount.textContent = item.amount ?? item.rawAmount;
    if (item.amount === null) {
      const raw = document.createElement('small');
      raw.className = 'raw';
      raw.textContent = t('rawUnits');
      amount.append(raw);
    }
    row.append(coin, amount);
    container.append(row);
  }
}

async function refresh() {
  addressBalances.replaceChildren();
  vaultBalances.replaceChildren();
  addressSection.hidden = true;
  vaultSection.hidden = true;
  updated.textContent = '';
  status.classList.remove('error');
  status.textContent = t('loading');
  status.hidden = false;
  button.disabled = true;
  try {
    const id = normalizeSuiId(input.value);
    input.value = id;
    explorerLink.hidden = false;
    explorerLink.href = `https://suiscan.xyz/mainnet/account/${id}`;
    const [addressResult, vaultResult] = await Promise.allSettled([
      fetchAddressBalances(id),
      fetchVaultBalances(id),
    ]);
    if (addressResult.status === 'fulfilled') {
      addressSection.hidden = false;
      showBalances(addressBalances, addressResult.value);
      addressEmpty.hidden = addressResult.value.length > 0;
    }
    if (vaultResult.status === 'fulfilled' && vaultResult.value.length > 0) {
      vaultSection.hidden = false;
      showBalances(vaultBalances, vaultResult.value);
      explorerLink.href = `https://suiscan.xyz/mainnet/object/${id}/fields`;
    }
    const errors = [];
    if (addressResult.status === 'rejected') errors.push(`${t('addressBalanceError')}: ${addressResult.reason?.message ?? t('queryFailed')}`);
    if (vaultResult.status === 'rejected') errors.push(`${t('internalBalanceError')}: ${vaultResult.reason?.message ?? t('queryFailed')}`);
    if (errors.length > 0) {
      status.classList.add('error');
      status.textContent = errors.join(t('errorSeparator'));
    } else if (addressResult.value.length === 0 && vaultResult.value.length === 0) {
      status.textContent = t('noBalance');
    } else {
      status.hidden = true;
    }
    updated.textContent = new Date().toLocaleTimeString(document.documentElement.lang, { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    status.classList.add('error');
    status.textContent = error instanceof Error ? error.message : t('genericFailure');
  } finally {
    button.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void refresh();
});

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const pageId = extractSuiIdFromUrl(tab?.url);
if (pageId) {
  input.value = pageId;
  void refresh();
} else {
  input.value = '';
  status.textContent = t('switchToSuiscan');
  addressSection.hidden = true;
  vaultSection.hidden = true;
  explorerLink.hidden = true;
}
