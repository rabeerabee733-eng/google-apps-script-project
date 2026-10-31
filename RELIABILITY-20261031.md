# Reliability release — 2026-10-31

The manager dashboard now has a consolidated health/reconciliation view, a production demand view, revision history/rollback for approved content and canonical products, daily recovery snapshots with alternate-destination restore drills, and a separate synthetic scenario runner.

## Safety and identity

Existing column-Q request IDs are already immutable and are used by booking, stickers, edit links and notification ledgers. This release verifies missing/duplicate IDs and display-number conflicts; it never rewrites historical identifiers, renumbers orders, repairs a suspected missing send automatically, or sends reconciliation messages. Two-minute propagation grace avoids reporting an acknowledged event while its local transaction is finishing; pending dispatches older than ten minutes are flagged. Snapshot pages must share the same order/export revision. Incomplete scans retain the last complete report and display a stale warning.

## Automatic checks and backup

- Manager-only APIs; existing session, role and same-origin protections apply.
- Google reconciliation every five minutes. Meta phone-read permission check every fifteen minutes; it does not claim message delivery.
- Google daily spreadsheet backup, including product overrides; validated sheet hashes. Restore drill copies backed-up sheets into one dedicated, marked spreadsheet. It refuses the live sheet or any backup as the test destination. It never overwrites live sheets.
- Karam recovery vault: consistent SQLite VACUUM snapshot plus content, contacts, follow-up, staff/manager account hashes and operational configuration. Seven verified daily copies on the existing persistent disk, permissions 0600. Existing media/content encrypted export remains available. Copies on the same disk are not off-site disaster recovery.
- Each new vault backup is copied to a temporary alternate directory, integrity-checked and parsed, then the test directory is removed. `node restore-recovery.mjs BACKUP_DIRECTORY EMPTY_DESTINATION` restores only to an empty alternate location. Do not start a live sender on restored queues; recovery requires human reconciliation of sent receipts first.
- Automatic Google maintenance is attempted hourly, idempotently once per Amman calendar day. No new external notification channel or scheduled messages.

## Production view

Current open-order demand grouped by the existing stable product ID/name and folder/paper/finished-product form. Completed quantities come from valid packing checklist revisions. Cancelled, delivered and returned orders are excluded. Unmatched/manual lines and inconsistent quantities are explicitly excluded and counted for review, not guessed. It is current backlog, not an independently measured press-output counter.

## Content control

Product prices/descriptions/availability continue to use Apps Script as authority for the booking site and Karam. Review confirmation precedes approval; history contains before/after values and time. Rollback creates another audited change with current revision validation. Reply history retains 30 changes with stale-editor rejection. Product names/IDs remain immutable to preserve old orders.

## Staging and checks

`npm run staging` runs a separate local dashboard on 127.0.0.1:4318 with a disposable directory and fake backend. No environment credentials are loaded. The manager's `التجربة` panel runs `npm run test:sandbox` scenarios in a child process with an explicit credential-free environment and blocked fetch, using only synthetic data and injected fake services. Booking, confirmation, duplication, delivery recovery, content revisions, backup restoration and tamper checks are exercised. The child receives neither production data paths nor secrets.

Validation: 820 Node release checks; 43 Apps Script regression files; 12 isolated scenarios. Existing real-customer messages were not used for tests.

Deploy Apps Script Reliability.gs, Operations.gs, ProductCatalog.gs and WhatsAppBridge.gs as one version to the three existing deployments, preserving access and URLs. Deploy the bot only from its existing CI-gated production branch. v91 and bot commit 1925036d2692d924d5571f937e16a16bcbabffc8 are compatible rollback points; rolling back code does not undo data or messages.
