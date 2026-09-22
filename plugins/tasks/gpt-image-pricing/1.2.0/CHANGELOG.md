---
changelogVersion: 1
plugin: "gpt-image-pricing"
version: "1.2.0"
locale: "en"
---

# Changelog

## [1.2.0]

### Changed

- Remove the legacy OpenAI channel type claim so the plugin no longer conflicts with the official Sora plugin, which owns channel type 1.
- Bind this plugin through a Task Plugin channel instead; its `openai_image` protocol and model-specific usage facts remain unchanged.

### Migration

- Install or update the plugin, create a Task Plugin channel bound to `gpt-image-pricing`, and configure its OpenAI API key and Base URL before use.
