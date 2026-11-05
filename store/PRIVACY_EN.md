# Sui Balance Privacy Policy

Last updated: November 4, 2026

Sui Balance has one purpose: to show on-chain coin balances for a Sui Mainnet address or object ID chosen by the user.

## Data handled

- When the user opens the extension popup, the extension reads the active tab's URL only to detect a Sui ID on a Suiscan account or object page. It does not read page content, browsing history, cookies, or wallet secrets.
- The user may also enter a Sui address or object ID manually. To perform a query, the extension sends that ID and relevant coin types over HTTPS to the public Sui GraphQL endpoint at `https://graphql.mainnet.sui.io/graphql`. It receives on-chain balances and coin metadata. The operator of that endpoint may process requests under its own policies.
- Results are shown only in the current popup. The extension does not save the entered ID or results in browser storage or send them to a server operated by the extension publisher. It has no ads, analytics, or tracking code.
- The browser opens a Suiscan page only when the user clicks the Suiscan link in the popup.

## Use and sharing

The extension handles this data only to display the requested on-chain balances. Other than requests to the public Sui GraphQL endpoint, the publisher does not sell, share, or use the data for another purpose. The extension's use of information obtained from Chrome APIs adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements.

## Retention and deletion

The extension does not persistently store addresses, object IDs, balances, or browsing data. Once the popup is closed, the extension does not retain its displayed contents.

For privacy questions, use the publisher contact details shown on the Chrome Web Store listing.
