---
changelogVersion: 1
plugin: "gpt-image-per-request"
version: "1.3.0"
locale: "en"
---

# Changelog

## [1.3.0]

### Changed

- Accept the GPT Image size tiers `1K`, `2K`, and `4K` in addition to the existing dimension values and `auto`.
- Keep the selected size tier in the `resolution` billing fact so administrators can price each tier separately.

### Migration

- Existing prices for `1024x1024`, `1536x1024`, `1024x1536`, and `auto` remain unchanged.
- Add pricing entries for `1K`, `2K`, and `4K` if those request values should have distinct prices; otherwise they remain unmatched by a tier-specific expression.
