# Customer order editing — download cutoff

Adds private customer edit links to the booking success page and an order-editor action for staff with `ordersEdit` permission. Staff can copy the generated link or open a prefilled WhatsApp message; the application does not send messages automatically. Issuing another link revokes the prior link.

Customer editing stops when the first **final sticker PDF export** is recorded. Preview-only downloads do not record exports. The existing export ledger is checked on every customer load/save; recording a final export and saving a customer edit acquire the same project script lock. The existing PDF revision check rejects previews built before a customer change. As before, final export is recorded immediately before initiating the browser download; a browser download failure therefore still leaves the order locked.

## Data handling

- Order number, original booking date, request ID, barcode, staff notes and administrative/payment metadata remain unchanged.
- Tokens are random; only SHA-256 hashes are stored in `روابط تعديل الحجوزات` in the same spreadsheet. Token authentication is independent of order number and phone. URLs use a fragment; the secret is not returned by JSONP booking-status polling.
- Customer writes affect C:O only. Customer-controlled text is escaped against spreadsheet formulas. The public response excludes staff notes, Ajyal accounts and administrative details.
- Product/wrapping quantities, current catalog prices, delivery charges and Ajyal at 3 JOD per teacher are calculated and validated on the server. Ajyal participation remains optional and capped by complete-bag quantity.
- Existing Ajyal records retain private fields, internal notes and completion attribution. A customer can amend/remove an unstarted subscription; removal retains a canceled historical row. Started subscriptions cannot be edited or removed by the customer.
- Nonstandard historical product lines/prices/counts fall back to contact/address-only editing without rewriting product details. Changing governorate recalculates delivery at the published rate. Reducing the total below an already-paid amount requires staff assistance.
- Concurrent order or Ajyal changes reject stale customer saves. The updated staff editor submits a revision too. Customer edits appear as a badge and in order history, with a timestamp in the order timeline.

## Verification

All 16 Node test files pass, including two focused suites covering token validation/revocation, secret exclusion, preserved identity and notes, server totals, product wrapping, optional teachers, service lifecycle, formula escaping, rollback after a service-write failure, custom historical data, both customer-save/export interleavings, stale previews, paid amounts, Arabic numbers, mobile counters and live lock display.

No real customer booking, sticker export, courier handover or payment was created to run tests. Live verification uses read-only pages and the no-token customer entry screen.

New Apps Script files: `CustomerEdit.gs`, `CustomerEdit.html`. Deploy the same project version to the existing employee/public, manager and booking deployments; preserve their access and execution identities.
