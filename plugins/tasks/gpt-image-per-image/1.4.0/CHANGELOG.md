---
changelogVersion: 1
plugin: "gpt-image-per-image"
version: "1.4.0"
locale: "en"
---

# Changelog

## [1.4.0]

### Changed

- Increase the task-plugin input image limit from 20 MiB to 100 MiB for image edit uploads.

### Migration

- No pricing or billing expression changes are required.
- The gateway and any reverse proxy must still allow the complete multipart request; this plugin limit only controls the per-file reference expansion.
