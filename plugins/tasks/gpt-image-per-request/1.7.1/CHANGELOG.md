---
changelogVersion: 1
plugin: "gpt-image-per-request"
version: "1.7.1"
locale: "en"
---

# Changelog

## [1.7.1]

### Changed

- Preserve the client's transport format for GPT Image edits: JSON URL references use `images[].image_url`, while uploaded files use multipart `image`/`image[]` and `mask` fields.
- Forward `stream`, `response_format`, and `output_format` on both JSON and multipart requests when provided.

### Migration

- No pricing or billing expression changes are required.
- Upgrade when routing GPT Image requests through codex2api, APIKEY.FAN, New API, or Sub2API-compatible upstreams with different JSON and multipart edit handling.
