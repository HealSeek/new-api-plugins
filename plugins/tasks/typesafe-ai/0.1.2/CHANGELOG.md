---
changelogVersion: 1
plugin: "typesafe-ai"
version: "0.1.2"
locale: "en"
---

# Changelog

## [0.1.2]

### Fixed

- Avoid executing a top-level `Set` during plugin declaration loading so older new-api JavaScript runtimes can preview and validate the plugin metadata.
