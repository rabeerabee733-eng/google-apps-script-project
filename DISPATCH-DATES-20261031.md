# Delivery dates and dispatch follow-up

Choose a delivery date before generating the sticker preview. The preview freezes it; final export persists it in `مواعيد دفعات الستكرات`. Reprinting or retrying the same batch cannot change the promised date or enqueue a second delivery notice. Preview alone does not write dispatch records.

Lifecycle events include batch, date and order identity for the private Karam delivery dashboard. Invalid booking numbers are reported separately, then revalidated after correction. The phone bridge uses `962` plus the nine-digit result of `canonicalPhone_`; only the known unsent legacy truncation is migrated.

Deployment files: `LifecycleNotifications.gs`, `Workflow.gs`, `AdminPortal.html`. Publish one version and point the three existing used deployments to it without changing their URLs/access. Deploy the Karam exact-date worker first. The utility template `karam_sticker_dispatch_date_v2` needs Meta approval for closed WhatsApp windows; the existing tomorrow template remains a fallback only for a genuinely next-day date.

Validation: `node --test tests/*.test.cjs`, including immutable dates, realistic production phone normalization, pending-only repair, invalid-phone recovery, preview isolation and frozen download payloads. No real customer test messages.
