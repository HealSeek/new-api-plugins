---
changelogVersion: 1
plugin: "gpt-image-pricing"
version: "1.4.0"
locale: "en"
---

# Changelog

## [1.4.0]

### Changed

- Remove `quality` from the billing usage schema and completion facts.
- Continue forwarding the request quality parameter upstream without using it for pricing.

### Migration

- Existing expressions using `u("quality")` must be changed to use `u("resolution")`, `u("image_count")`, or `u("request_count")`.
