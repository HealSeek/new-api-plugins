---
changelogVersion: 1
plugin: "gpt-image-per-image"
version: "1.5.0"
locale: "en"
---

# Changelog

## [1.5.0]

### Fixed

- Deduplicate image references when the normalized request contains both `image` and `images`.
- Prevent image-edit multipart requests from including the same uploaded file twice and exceeding upstream request limits.

### Migration

- No pricing or billing expression changes are required.
- Upgrade to this version for image-edit requests; existing resolution and count settings remain compatible.
