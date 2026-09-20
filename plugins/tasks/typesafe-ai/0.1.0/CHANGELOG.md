---
changelogVersion: 1
plugin: "typesafe-ai"
version: "0.1.0"
locale: "en"
---

# Changelog

## [0.1.0]

### Added

- Add a TypeSafe AI task plugin with the `/typesafe/v1/systemone` native route.
- Support `jev-latest`, `jev-preview`, and `jev-1.13.0`.
- Validate `noul`, `choice`, and `score` questions and structured answers.
- Report provider input and output token usage for gateway billing.

### Migration

- No price reconfiguration is required by the plugin itself; configure the gateway's input-token price for the TypeSafe Jev models, with output-token pricing set according to the provider's current pricing policy.
