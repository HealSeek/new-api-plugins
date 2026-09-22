---
changelogVersion: 1
plugin: "gpt-image-pricing"
version: "1.3.0"
locale: "en"
---

# Changelog

## [1.3.0]

### Added

- Add the `request_count` usage fact, fixed at one per API request, for per-request pricing.
- Keep `image_count` available for per-image pricing in the same plugin.

### Migration

- Use `u("request_count")` for one fixed charge per request, or `u("image_count")` for per-image charging. Existing resolution and quality facts remain available.
