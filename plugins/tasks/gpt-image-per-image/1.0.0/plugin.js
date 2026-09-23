// GPT Image pricing task plugin for new-api rc39+
// Supports OpenAI Images API generation and edit requests while exposing
// resolution, request_count, and image_count as task billing facts.

const MODELS = ["gpt-image-1", "gpt-image-1-mini"];
const RESOLUTIONS = ["1024x1024", "1536x1024", "1024x1536", "auto"];
const QUALITIES = ["low", "medium", "high", "xhigh", "max", "auto"];
const MAX_IMAGES = 10;
const MAX_INPUT_IMAGE_BYTES = 20 * 1024 * 1024;

export const meta = {
  apiVersion: 1,
  key: "gpt-image-per-image",
  name: "GPT Image Per Image",
  version: "1.0.0",
  icon: "OpenAI.Color",
  author: { name: "Airovo", url: "https://www.airovo.cn" },
  website: "https://platform.openai.com/docs/guides/images",
  description: {
    en: "OpenAI GPT Image generation and editing with per-image billing",
    zh: "OpenAI GPT Image 生图与编辑（按图片计费）",
  },
  baseUrl: "https://api.openai.com",
  auth: "api_key",
  models: ["gpt-image-1", "gpt-image-1-mini", "gpt-image-1.5", "gpt-image-2", "gpt-image-2.5-sunburst", "gpt-image-2.5-flare"],
  fetchMode: "per_task",
  usageSchema: {
    image_count: {
      type: "number",
      unit: "count",
      unitLabel: { en: "image", zh: "张" },
      description: { en: "Image generation unit price", zh: "图片生成单价" },
    },
    resolution: {
      enum: ["1024x1024", "1536x1024", "1024x1536", "auto"],
      description: { en: "Output image resolution", zh: "输出图片分辨率" },
    },
  },
  usageExamples: [
    { label: "1K image", facts: { image_count: 1, resolution: "1024x1024" } },
    { label: "2K image", facts: { image_count: 1, resolution: "1536x1024" } },
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
  if (!RESOLUTIONS.includes(valueText)) throw new Error("size must be 1024x1024, 1536x1024, 1024x1536, or auto");
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
  if (typeof value === "string" && /^(https?:\/\/|data:image\/)/i.test(value)) return value;
  if (isObject(value) && typeof value.__fileRef === "string") return value;
  throw new Error("image must be an HTTP URL, data URL, or uploaded file");
}

function collectImages(req) {
  const values = [];
  for (const value of [].concat(req.image ?? [], req.images ?? [])) {
    if (value === "") continue;
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
  return { model, prompt, images, size, quality, n, response_format: req.response_format };
}

function factsFromRequest(ctx) {
  const req = normalizeRequest(ctx);
  return { image_count: req.n, resolution: req.size };
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
  if (req.images.length || ctx.operation === "edit") {
    const parts = [
      { name: "model", value: req.model },
      { name: "prompt", value: req.prompt },
      { name: "size", value: req.size },
      { name: "quality", value: req.quality },
      { name: "n", value: String(req.n) },
    ];
    for (const image of req.images) {
      if (isObject(image) && image.__fileRef) parts.push({ name: "image[]", fileRef: image.__fileRef });
      else parts.push({ name: "image[]", value: image });
    }
    return { url: ctx.baseUrl + (ctx.operation === "edit" ? "/v1/images/edits" : "/v1/images/generations"), method: "POST", headers, bodyType: "multipart", parts };
  }
  headers["Content-Type"] = "application/json";
  return {
    url: ctx.baseUrl + "/v1/images/generations",
    method: "POST",
    headers,
    body: { model: req.model, prompt: req.prompt, size: req.size, quality: req.quality, n: req.n },
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
  facts.image_count = count;
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
      const normalized = { model, prompt, image: images[0], images, size: req.size || req.resolution, n: req.n, response_format: req.response_format };
      return { kind: "submit", model, action: images.length ? "image_to_image" : "text_to_image", requestBody: normalized };
    },
    render(ctx, task) {
      return renderImages(ctx, task);
    },
  },
};
