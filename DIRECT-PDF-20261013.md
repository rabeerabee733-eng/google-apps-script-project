# Direct sticker PDF download

Published both existing administration and employee endpoints on version 49 (2026-10-13, 20:39 Asia/Amman). The preparation tab has a direct PDF button, separate preview, and preview-only PDF download. Final downloads generate the file before validating current Drive revisions and recording the existing export ledger. Preview downloads do not write the ledger.

Packaging validation checks each numbered product's quantity against folder/paper splits when specified, then checks totals against Sheet columns I/J/K. Arabic digits are supported. Mismatches stop preview/export with the order number; data is not silently corrected. Product text remains sourced from Drive.

Verified actual preview PDF for orders 709–710: two pages, each 283.464567 points square (100 mm), rendered and visually checked for Arabic, single product rows and barcodes. Order 709 includes one folder; 710 includes two paper bags. Ledger remained at order 500. Unit tests cover packaging mismatch, direct PDF path, authentication, permissions, startup, label layout, Ajyal and courier management. Browser download event timed out, but the downloaded file was found and verified locally.

Renderer: html2canvas 1.4.1, pinned CDN asset; existing PDF image encoder reused. No booking page or employee account settings changed.
