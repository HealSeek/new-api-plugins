---
changelogVersion: 1
plugin: "typesafe-ai"
version: "0.1.4"
locale: "en"
---

# Changelog

## [0.1.4]

### Fixed

- Align the TypeSafe System One request, immediate-completion, and usage-settlement hooks with the official TypeSafe task plugin implementation.
- Bill only provider-reported `input_tokens`; output tokens remain free and are no longer part of the plugin usage schema.
- Preserve the gateway public request ID for synchronous task completion and support nullable structured state, instructions, and criteria entries.

### Migration

- Reconfigure the TypeSafe model prices to use the `input_tokens` usage field only. Existing `output_tokens` pricing is no longer used by this plugin version.
