---
changelogVersion: 1
plugin: "gpt-image-per-request"
version: "1.0.0"
locale: "en"
---

# Changelog

## [1.0.0]

### Added

- Add an `openai_image` GPT Image task plugin with one fixed billing unit per API request.
- Support GPT Image generation and editing with resolution facts for tier selection.

### Migration

- Configure plugin pricing with `u("request_count")`; for example, `u("resolution") == "1024x1024" ? tier("1K", u("request_count") * 0.04) : tier("2K", u("request_count") * 0.08)`.
