// GPT Image pricing task plugin for new-api rc39+
// Supports OpenAI Images API generation and edit requests while exposing
// resolution, request_count, and image_count as task billing facts.

const MODELS = ["gpt-image-1", "gpt-image-1-mini", "gpt-image-1.5", "gpt-image-2", "gpt-image-2.5-sunburst", "gpt-image-2.5-flare"];
const RESOLUTIONS = ["1024x1024", "1536x1024", "1024x1536", "1K", "2K", "4K", "auto"];
const QUALITIES = ["low", "medium", "high", "xhigh", "max", "auto"];
const MAX_IMAGES = 10;
const MAX_INPUT_IMAGE_BYTES = 100 * 1024 * 1024;

export const meta = {
  apiVersion: 1,
  key: "gpt-image-per-request",
  name: "GPT Image Per Request",
  version: "1.7.1",
  icon: "OpenAI.Color",
  author: { name: "Airovo", url: "https://www.airovo.cn" },
  website: "https://platform.openai.com/docs/guides/images",
  description: {
    en: "OpenAI GPT Image generation and editing with per-request billing",
    zh: "OpenAI GPT Image 生图与编辑（按请求计费）",
  },
  baseUrl: "https://api.openai.com",
  auth: "api_key",
  models: ["gpt-image-1", "gpt-image-1-mini", "gpt-image-1.5", "gpt-image-2", "gpt-image-2.5-sunburst", "gpt-image-2.5-flare"],
  fetchMode: "per_task",
  usageSchema: {
    request_count: {
      type: "number",
      unit: "count",
      unitLabel: { en: "request", zh: "次" },
      description: { en: "Image request unit price", zh: "图片请求单价" },
    },
    resolution: {
      enum: ["1024x1024", "1536x1024", "1024x1536", "1K", "2K", "4K", "auto"],
      description: { en: "Output image resolution", zh: "输出图片分辨率" },
    },
  },
  usageExamples: [
    { label: "1K request", facts: { request_count: 1, resolution: "1024x1024" } },
    { label: "2K request", facts: { request_count: 1, resolution: "2K" } },
  ],
  protocols: [
    {
      name: "openai_image",
      models: ["gpt-image-1", "gpt-image-1-mini", "gpt-image-1.5", "gpt-image-2", "gpt-image-2.5-sunburst", "gpt-image-2.5-flare"],
    },
  ],
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return String(value ?? "").trim();
}

function requireModel(model) {
  const value = text(model);
  if (!MODELS.includes(value)) throw new Error("unsupported GPT Image model: " + value);
  return value;
}

function normalizeResolution(value) {
  const valueText = text(value) || "1024x1024";
  if (!RESOLUTIONS.includes(valueText)) throw new Error("size must be 1024x1024, 1536x1024, 1024x1536, 1K, 2K, 4K, or auto");
  return valueText;
}

function normalizeQuality(value) {
  const valueText = text(value) || "auto";
  if (!QUALITIES.includes(valueText)) throw new Error("quality must be low, medium, high, xhigh, max, or auto");
  return valueText;
}

function normalizeCount(value) {
  const count = value === undefined || value === null || value === "" ? 1 : Number(value);
  if (!Number.isInteger(count) || count < 1 || count > MAX_IMAGES) throw new Error("n must be an integer between 1 and 10");
  return count;
}

function imageRef(value) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "string" && /^(https?:\/\/|data:image\/)/i.test(value)) return value;
  if (typeof value === "string" && /^[\[{]/.test(value.trim())) {
    try { return imageRef(JSON.parse(value)); } catch (_) { /* fall through */ }
  }
  if (isObject(value) && Object.prototype.hasOwnProperty.call(value, "image_url")) return imageRef(value.image_url);
  if (isObject(value) && Object.prototype.hasOwnProperty.call(value, "url")) return imageRef(value.url);
  if (isObject(value) && typeof value.__fileRef === "string") return value;
  throw new Error("image must be an HTTP URL, data URL, or uploaded file");
}

function collectImages(req) {
  const values = [];
  const seen = new Set();
  const raw = [].concat(req.image ?? [], req.images ?? []);
  const expanded = [];
  for (const value of raw) {
    if (typeof value === "string" && /^\[/.test(value.trim())) {
      try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) { expanded.push(...parsed); continue; } } catch (_) { /* keep original */ }
    }
    expanded.push(value);
  }
  for (const value of expanded) {
    if (value === null || value === undefined || value === "") continue;
    const identity = isObject(value) && typeof value.__fileRef === "string" ? "file:" + value.__fileRef : typeof value === "string" ? "url:" + value : "object:" + String(value);
    if (seen.has(identity)) continue;
    seen.add(identity);
    values.push(imageRef(value));
  }
  return values;
}

function normalizeRequest(ctx) {
  const req = ctx.requestBody || {};
  if (!isObject(req)) throw new Error("request body must be an object");
  const model = requireModel(ctx.upstreamModel || ctx.model || req.model);
  const prompt = text(req.prompt);
  if (!prompt) throw new Error("prompt is required");
  const images = collectImages(req);
  const size = normalizeResolution(req.size || req.resolution);
  const quality = normalizeQuality(req.quality);
  const n = normalizeCount(req.n);
  const mask = req.mask === null || req.mask === undefined || req.mask === "" ? undefined : imageRef(req.mask);
  return { model, prompt, images, mask, size, quality, n, stream: req.stream, response_format: req.response_format, output_format: req.output_format };
}

function factsFromRequest(ctx) {
  const req = normalizeRequest(ctx);
  return { request_count: 1, resolution: req.size };
}

function parseJsonBody(ctx) {
  if (!ctx.body || ctx.body.kind !== "json" || !isObject(ctx.body.value)) throw new Error("JSON object required");
  return ctx.body.value;
}

function parseMultipartBody(ctx) {
  if (!ctx.body || ctx.body.kind !== "multipart") throw new Error("JSON or multipart body required");
  const req = {};
  for (const [name, values] of Object.entries(ctx.body.fields || {})) {
    if (values.length > 1) throw new Error(name + " must be provided once");
    req[name] = values[0];
  }
  req.images = [];
  for (const file of ctx.body.files || []) {
    if (file.field === "image" || /^image\[\d*\]$/.test(file.field)) {
      req.images.push({ __fileRef: file.ref, encoding: "dataUrl", mimeType: file.mimeType || "image/png", maxBytes: MAX_INPUT_IMAGE_BYTES });
    } else if (file.field === "mask") {
      req.mask = { __fileRef: file.ref, encoding: "dataUrl", mimeType: file.mimeType || "image/png", maxBytes: MAX_INPUT_IMAGE_BYTES };
    } else {
      throw new Error("unexpected file field: " + file.field);
    }
  }
  return req;
}

export function buildSubmitRequest(ctx) {
  const req = normalizeRequest(ctx);
  const headers = { Authorization: "Bearer " + ctx.apiKey, Accept: "application/json" };
  const hasFile = req.images.some((image) => isObject(image) && typeof image.__fileRef === "string") || (isObject(req.mask) && typeof req.mask.__fileRef === "string");
  if (hasFile) {
    const parts = [
      { name: "model", value: req.model },
      { name: "prompt", value: req.prompt },
      { name: "size", value: req.size },
      { name: "quality", value: req.quality },
      { name: "n", value: String(req.n) },
    ];
    if (req.response_format) parts.push({ name: "response_format", value: req.response_format });
    if (req.output_format) parts.push({ name: "output_format", value: req.output_format });
    if (req.stream !== undefined && req.stream !== null && req.stream !== "") parts.push({ name: "stream", value: String(req.stream) });
    const imageField = req.images.length === 1 ? "image" : "image[]";
    for (const image of req.images) {
      if (isObject(image) && image.__fileRef) parts.push({ name: imageField, fileRef: image.__fileRef });
      else parts.push({ name: imageField, value: image });
    }
    if (isObject(req.mask) && req.mask.__fileRef) parts.push({ name: "mask", fileRef: req.mask.__fileRef });
    return { url: ctx.baseUrl + "/v1/images/edits", method: "POST", headers, bodyType: "multipart", parts };
  }
  headers["Content-Type"] = "application/json";
  const body = { model: req.model, prompt: req.prompt, size: req.size, quality: req.quality, n: req.n };
  if (req.response_format) body.response_format = req.response_format;
  if (req.output_format) body.output_format = req.output_format;
  if (req.stream !== undefined && req.stream !== null) body.stream = req.stream;
  if (ctx.operation === "edit") {
    body.images = req.images.map((image) => ({ image_url: image }));
    if (req.mask !== undefined) body.mask = { image_url: req.mask };
  }
  return {
    url: ctx.baseUrl + (ctx.operation === "edit" ? "/v1/images/edits" : "/v1/images/generations"),
    method: "POST",
    headers,
    body,
  };
}

export function parseSubmitResponse(ctx, resp) {
  if (!resp || resp.statusCode < 200 || resp.statusCode >= 300) throw new Error("OpenAI Images returned HTTP " + (resp && resp.statusCode));
  if (!isObject(resp.body) || !Array.isArray(resp.body.data)) throw new Error("OpenAI Images response is missing data");
  const taskId = text(ctx.publicTaskId);
  if (!taskId) throw new Error("missing gateway task id");
  return { taskId, taskData: resp.body, immediate: { status: "SUCCESS", progress: "100%" } };
}

export function extractUsage(ctx) {
  if (ctx.usagePurpose === "billing_ratios") return null;
  return factsFromRequest(ctx);
}

export function extractUsageOnComplete(ctx, _result, body) {
  const count = body && Array.isArray(body.data) ? body.data.length : 0;
  if (count < 1) throw new Error("OpenAI Images returned no output images");
  const facts = factsFromRequest(ctx);
  facts.request_count = 1;
  return facts;
}

export function buildQueryRequest() {
  throw new Error("GPT Image synchronous requests do not support polling");
}

export function parseTaskResult() {
  return { status: "UNKNOWN", reason: "GPT Image synchronous requests do not support polling" };
}

function renderImages(_ctx, task) {
  const data = task && task.data && Array.isArray(task.data.data) ? task.data.data : [];
  return { created: task.created_at, data };
}

export const protocols = {
  openai_image: {
    decodeRequest(ctx) {
      const req = ctx.body && ctx.body.kind === "json" ? parseJsonBody(ctx) : parseMultipartBody(ctx);
      const model = requireModel(ctx.model);
      const prompt = text(req.prompt);
      if (!prompt) throw new Error("prompt is required");
      const images = collectImages(req);
      if (ctx.operation === "edit" && images.length === 0) throw new Error("image is required for edits");
      const normalized = { model, prompt, image: images[0], images, mask: req.mask, size: req.size || req.resolution, quality: req.quality, n: req.n, stream: req.stream, response_format: req.response_format, output_format: req.output_format };
      return { kind: "submit", model, action: images.length ? "image_to_image" : "text_to_image", requestBody: normalized };
    },
    render(ctx, task) {
      return renderImages(ctx, task);
    },
  },
};
