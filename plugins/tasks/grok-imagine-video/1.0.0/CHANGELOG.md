---
changelogVersion: 1
plugin: "grok-imagine-video"
version: "1.0.0"
locale: "en"
---

# Changelog

## [1.0.0]

### Added

- Add the Grok Imagine Video task plugin for xAI's asynchronous video API.
- Support `grok-imagine-video`, `grok-imagine-video-1.5`, and `grok-imagine-video-1.5-preview`.
- Support text-to-video and image-to-video requests through the `openai_video` protocol.
- Poll `pending`, `done`, `failed`, and `expired` task states and proxy completed MP4 artifacts.
- Validate duration, aspect ratio, and resolution before submitting upstream requests.

### Migration

- No prices are hard-coded in the plugin. Configure the video pricing for the declared models in the gateway channel settings before enabling production traffic.
