---
changelogVersion: 1
plugin: "gpt-image-per-image"
version: "1.7.0"
locale: "en"
---

# Changelog

## [1.7.0]

### Fixed

- Match the upstream GPT Image JSON contract for both generation and edit requests.
- Send edit inputs as `images[].image_url` instead of multipart `image` fields.
- Support `mask.image_url` for JSON image edits.
- Forward `output_format` as well as `response_format`.
- Forward `response_format` for generation and edit requests.
- Accept JSON-stringified image arrays and `{image_url}` / `{url}` wrapper objects from clients.

### Migration

- No pricing or billing expression changes are required.
- Upgrade this version for the `codex2api` GPT Image JSON API; older versions send the wrong edit body format.
