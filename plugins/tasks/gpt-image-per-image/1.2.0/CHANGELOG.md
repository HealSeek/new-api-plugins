---
changelogVersion: 1
plugin: "gpt-image-per-image"
version: "1.2.0"
locale: "en"
---

# Changelog

## [1.2.0]

### Changed

- Restrict the plugin to the rc40 `openai_image` host protocol for `/v1/images/generations` and `/v1/images/edits`.
- Remove the unsupported OpenAI Responses image-tool claim and Markdown-based `renderFinal` fallback.

### Migration

- This release does not change the per-image pricing facts or resolution fields.
- To use this plugin, bind it to a channel that serves the OpenAI Images endpoints. Requests sent to `/v1/responses` are not handled by this plugin.
