# Chrome Web Store reviewer fields — not for the public description

Name: Sui Balance
Category: Tools
Short summary: View coin balances for Sui Mainnet addresses and supported Vault objects.
Public description: Copy the entire contents of `LISTING_EN.md`, without this file.
Homepage URL: https://sui-balance.0xclark.dev/
Privacy policy URL: https://sui-balance.0xclark.dev/privacy/

Single purpose: Display on-chain coin balances for a Sui Mainnet address or object ID chosen by the user.

`activeTab`: Read the active tab URL only when the user opens the popup, to detect a Sui ID on a Suiscan page.

`https://graphql.mainnet.sui.io/*`: Query on-chain balances, object dynamic fields, and coin metadata through the public Sui GraphQL endpoint.

Data handled: The Sui ID found in the current Suiscan URL or entered by the user, plus coin types needed for metadata requests. The ID and coin types are sent over HTTPS to the public Sui GraphQL endpoint. The extension does not persist them or send them to a publisher-operated server.

Remote code: No. All executable JavaScript is bundled in the extension; the public GraphQL endpoint returns data only.
