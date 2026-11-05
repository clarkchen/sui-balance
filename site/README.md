# Sui Balance product site

Public site: https://sui-balance.0xclark.dev/

The static site lives in `dist/`. English is the default; `/zh/` provides Chinese. Privacy policies are at `/privacy/` and `/zh/privacy/`.

The private deployment checkout keeps its Sites project ID in `.openai/hosting.json`; that file is excluded from this public repository. Reuse the existing Site when publishing updates.

The mock balance card on the home page is clearly labeled as an illustrative preview with sample amounts. It is not a screenshot of a real account.

The product website offers optional Google Analytics 4 visitor statistics (measurement ID `G-3JN86QC9JJ`). `/assets/analytics.js` loads the Google tag only after explicit consent; visitors can change their choice through the footer. The Chrome extension does not include this tag.
