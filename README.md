# Airovo New API Plugins

Public marketplace source for New API Task Plugins.

Maintained by [www.airovo.cn](https://www.airovo.cn).

## Available task plugins

| Plugin | Description | Gateway route | Models |
| --- | --- | --- | --- |
| `typesafe-ai` | TypeSafe AI structured decisions | `POST /typesafe/v1/systemone` | `jev-latest`, `jev-preview`, `jev-1.13.0` |
| `grok-imagine-video` | Grok Imagine Video asynchronous text-to-video and image-to-video | `POST /v1/videos` through `openai_video` | `grok-imagine-video`, `grok-imagine-video-1.5`, `grok-imagine-video-1.5-preview` |

This repository currently contains one task plugin. New plugins will be listed
in this table and published through the root `index.json`.

## Maintainer

- Website: [www.airovo.cn](https://www.airovo.cn)
- Marketplace source: [HealSeek/new-api-plugins](https://github.com/HealSeek/new-api-plugins)

## Marketplace source

Serve this repository from a stable HTTPS URL and use its `index.json` as the
marketplace index URL in New API. The index references immutable plugin files
under `plugins/tasks/typesafe-ai/0.1.4/` and the sidecar icon at
`plugins/tasks/typesafe-ai/icon.png`.

Review each plugin's source, upstream endpoint, permissions, and pricing
before enabling it in a shared or production gateway.
