# Monthly investment target

The mobile app defaults to RWF 100,000 monthly and supports an editable whole-RWF target in Settings, including a RWF 300,000 preset. The target is saved per account and server on the device; it is not synced between devices. The current target is also used as the comparison line for the recent three months, not as a historical record of previous target settings.

Progress counts confirmed purchase cash cost (execution value, accrued interest and fees), with pending applications shown separately. Sold/matured purchases still count in their purchase month. Market gains, repayments and coupon receipts are not contributions.

Publish lib/bonds/mobile-overview.ts with the existing compact API. Its optional monthlyInvestmentTotals field adds complete RWF totals for twelve calendar months without transferring all lots. Before deployment, the app offers Check progress to explicitly load full history; it never presents a truncated preview as exact goal progress. Tests are in tests/mobile-overview.test.mjs.
