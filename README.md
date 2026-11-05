# Sui Balance

A read-only Chrome extension for checking Sui Mainnet coin balances. It shows address balances and supported Vault balances separately, so you can see where each balance is held.

- [Product page](https://sui-balance.0xclark.dev/)
- [Chrome Web Store](https://chromewebstore.google.com/detail/sui-balance/nfdaacndhkfdlbdhhciegmhfbpmimnig)
- [Privacy policy](https://sui-balance.0xclark.dev/privacy/)
- [中文产品页面](https://sui-balance.0xclark.dev/zh/)

## What it does

Open a Suiscan account or object page, then click the extension icon to detect its Sui ID. You can also paste any Sui address or object ID into the popup. The extension queries the public Sui Mainnet GraphQL endpoint and displays balances by coin type. It uses on-chain decimals when available and labels raw base units otherwise. Coin types with the same symbol remain distinguishable by package ID.

The extension does not connect to a wallet, request private keys, store queries, calculate fiat values, or aggregate positions across unrelated DeFi protocols. Public endpoint indexing delays and rate limits can affect results.

## Install

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/sui-balance/nfdaacndhkfdlbdhhciegmhfbpmimnig), or load this repository as an unpacked extension in `chrome://extensions` with Developer mode enabled. The manifest is at the repository root.

## Develop

The extension is dependency-free. Run its tests with:

```sh
node --test test/*.test.mjs
```

`balance.mjs` contains the GraphQL queries and balance logic; `popup.mjs`, `popup.html`, and `popup.css` implement the interface. Translations live in `_locales/`. The static product page is in `site/dist/`. Store listing copy and review notes are in `store/`.

## License

MIT. See [LICENSE](LICENSE).
