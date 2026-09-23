---
changelogVersion: 1
plugin: "gpt-image-per-image"
version: "1.6.0"
locale: "en"
---

# Changelog

## [1.6.0]

### Fixed

- Use the standard `image` multipart field for a single edit image and `image[]` only when multiple images are submitted.
- Preserve the 1.5.0 duplicate-reference fix.

### Migration

- No pricing or billing expression changes are required.
- Upgrade the task plugin when the upstream image-edit endpoint rejects a single `image[]` multipart field.
