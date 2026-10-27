# Sticker download delivery notices

Final PDF export queues one WhatsApp delivery notice per selected order. Preview does not enqueue. The immutable first export batch and the existing lifecycle event ID prevent duplicate messages on repeated downloads, network retries, or the lifecycle poller. Enqueuing occurs under the existing export lock, so a newly booked order downloaded before the first lifecycle poll is still included.

Deploy the current `LifecycleNotifications.gs` and `Workflow.gs` to the existing Apps Script project. Publish a new version to the existing booking/employee and manager deployments, retaining their deployment IDs and access settings. GitHub source updates alone do not publish Apps Script. The current session could not access the editor because Google presented a human-verification challenge.

The worker in `rabeerabee733-eng/whatsapp-bot` uses the `source: sticker_download` field returned by `lifecycle_details` to choose the specific Arabic delivery notice. Legacy/manual status events retain their existing generic notification. Outside a valid WhatsApp service window the dedicated `karam_sticker_dispatch_v1` Arabic UTILITY template must have the exact approved body. The worker submits the template once in production and refreshes approval without sending test messages. Queued notices expire at the end of the original export date in Asia/Amman to avoid a false tomorrow promise after delays.

Validation: `node tests/sticker-dispatch.test.cjs`; `node --test tests/lifecycle.test.cjs tests/sticker-workflow.test.cjs tests/sticker-history.test.cjs tests/customer-edit.test.cjs tests/portal-template.test.cjs`. Worker dispatch tests cover content, selected customers, duplication/restart, stale or reassigned orders, template approval, uncertain sends and legacy status compatibility.

No real customer orders were exported or messaged for testing.
