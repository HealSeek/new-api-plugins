---
changelogVersion: 1
plugin: "gpt-image-pricing"
version: "1.0.0"
locale: "en"
---

# Changelog

## [1.0.0]

### Added

- Add an `openai_image` task plugin for GPT Image generation and image editing.
- Support `gpt-image-1` and `gpt-image-1-mini` on OpenAI channels.
- Expose `image_count`, `resolution`, and `quality` usage facts for parameter-aware task billing.
- Support JSON generation requests and multipart image edit requests.

### Migration

- Configure a task expression using the declared usage facts, for example `u("resolution") == "1024x1024" ? tier("1K", u("image_count") * 0.04) : tier("2K", u("image_count") * 0.08)`.
