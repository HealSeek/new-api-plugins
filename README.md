# Private New API Plugins

Personal marketplace source for New API Task Plugins.

## Included plugin

- `typesafe-ai`: TypeSafe AI native evaluation endpoint
- Gateway route: `POST /typesafe/v1/systemone`
- Upstream: `POST https://api.typesafe.ai/v1/systemone`
- Models: `jev-latest`, `jev-preview`, `jev-1.13.0`

## Marketplace source

Serve this repository from a stable HTTPS URL and use its `index.json` as the
marketplace index URL in New API. The index references immutable plugin files
under `plugins/tasks/typesafe-ai/0.1.0/` and the sidecar icon at
`plugins/tasks/typesafe-ai/icon.png`.

The repository is personal-use software. Review plugin source and pricing
before enabling it in a shared or production gateway.
