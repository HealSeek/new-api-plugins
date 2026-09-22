---
changelogVersion: 1
plugin: "gpt-image-pricing"
version: "1.1.0"
locale: "en"
---

# Changelog

## [1.1.0]

### Added

- Add the current GPT Image model aliases `gpt-image-1.5`, `gpt-image-2`, `gpt-image-2.5-sunburst`, and `gpt-image-2.5-flare`.
- Accept the newer `xhigh` and `max` quality values in image requests and billing facts.

### Changed

- Keep the same `openai_image` protocol and resolution-aware usage facts for all declared GPT Image models.
