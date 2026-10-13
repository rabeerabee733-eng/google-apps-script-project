# Administration tab update — 2026-10-13

Stickers remain in preparation/printing, using the supplied 100 × 100 mm design. Preview uses live Drive Sheet rows, defaults to sheet order, and offers numeric order. Barcode remains anchored to order 1. Long orders paginate with continuation footers. Export checks preview revisions and rejects changed orders; next-range suggestion uses the last exported order. No production print/export was performed during validation.

Ajyal and employee accounts have independent top-level tabs. Permissions are grouped by tab, including an Ajyal-only preset. Employee RPCs enforce read/action permissions server-side. Accounts remain manager-only. Completing an Ajyal request attributes the employee; subsequent edits preserve the original completer.

Verification: portal template, employee startup, tab UI, authentication, sticker ledger, Ajyal, courier management and courier export tests. Existing customer data, accounts, barcode settings and export history were not edited.

## Live verification

Published to the existing manager endpoint as version 46 and employee endpoint as version 45, both showing TAB-PERMISSIONS-V3. Access/execute settings were retained. Manager preparation tab shows Drive-order selector and ledger; next-range button selects 501. A read-only preview of order 2908 produced one 100 mm square label with no overflow. Ajyal loaded both existing records. Employee endpoint shows only sign-in before authentication. Ajyal-only preset selects exactly ajyalRead/ajyalEdit; no account was saved or modified. All eight test suites passed.
