// TypeSafe Jev Task Plugin for new-api Task Plugin API v1.
//
// Exposes a native, synchronous evaluation endpoint at:
//   POST /typesafe/v1/systemone
//
// The plugin forwards the native TypeSafe request to /v1/systemone, validates
// the structured answer, and reports input/output token usage to the host.

const MODELS = ["jev-latest", "jev-preview", "jev-1.13.0"];
const QUESTION_TYPES = ["noul", "choice", "score"];

export const meta = {
  apiVersion: 1,
  key: "typesafe-ai",
  name: "TypeSafe AI",
  // Text fallback for gateways that predate sidecar icon support.
  icon: "text:TA",
  // The gateway reads this sidecar file during upload; do not replace it with
  // a data URI or remote URL in the manifest.
  version: "0.1.3",
  author: { name: "new-api community" },
  website: "https://docs.typesafe.ai/",
  description: {
    en: "TypeSafe AI structured decisions",
    zh: "TypeSafe AI 结构化决策评估",
  },
  // Keep declaration fields as literals so rc38's static marketplace preview
  // can display them without executing JavaScript.
  models: ["jev-latest", "jev-preview", "jev-1.13.0"],
  baseUrl: "https://api.typesafe.ai",
  fetchMode: "per_task",
  usageSchema: {
    input_tokens: {
      type: "number",
      unit: "token",
      description: { en: "Input tokens", zh: "输入 token" },
    },
    output_tokens: {
      type: "number",
      unit: "token",
      description: { en: "Output tokens", zh: "输出 token" },
    },
  },
  // Token schemas require at least one complete display-only usage example.
  usageExamples: [
    {
      label: "standard evaluation",
      facts: { input_tokens: 1000, output_tokens: 0 },
    },
  ],
  routes: [
    {
      method: "POST",
      path: "/typesafe/v1/systemone",
      type: "submit",
      models: ["jev-latest", "jev-preview", "jev-1.13.0"],
      decode: "createJob",
      render: "jobCreated",
    },
  ],
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isJsonValue(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (isObject(value)) return Object.keys(value).every((key) => isJsonValue(value[key]));
  return false;
}

function isTextOrStructured(value) {
  return typeof value === "string" || Array.isArray(value) || isObject(value);
}

function requireJsonObject(ctx) {
  if (!ctx.body || ctx.body.kind !== "json" || !isObject(ctx.body.value)) {
    throw new Error("JSON object required");
  }
  return ctx.body.value;
}

function validateQuestion(id, question) {
  if (!isObject(question)) throw new Error("question " + id + " must be an object");
  if (QUESTION_TYPES.indexOf(question.type) < 0) {
    throw new Error("question " + id + " has unsupported type");
  }
  if (!isTextOrStructured(question.instructions)) {
    throw new Error("question " + id + " instructions must be a string, object or array");
  }
  if (!isJsonValue(question.instructions)) {
    throw new Error("question " + id + " instructions must be valid JSON");
  }

  if (question.type === "noul") {
    if (question.criteria === undefined) return;
    if (!isObject(question.criteria)) throw new Error("question " + id + " noul criteria must be an object");
    for (const key of Object.keys(question.criteria)) {
      if (key !== "true" && key !== "false") throw new Error("question " + id + " noul criteria keys must be true or false");
      if (!isTextOrStructured(question.criteria[key])) {
        throw new Error("question " + id + " noul criteria values must be strings, objects or arrays");
      }
    }
    return;
  }

  if (question.type === "choice") {
    if (!isObject(question.criteria) || Object.keys(question.criteria).length === 0) {
      throw new Error("question " + id + " choice criteria must be a non-empty object");
    }
    if (Object.keys(question.criteria).length > 255) throw new Error("question " + id + " has too many choice options");
    for (const value of Object.values(question.criteria)) {
      if (value !== null && !isTextOrStructured(value)) {
        throw new Error("question " + id + " choice criteria values must be null, strings, objects or arrays");
      }
    }
    return;
  }

  if (!Array.isArray(question.criteria) || question.criteria.length < 2 || question.criteria.length > 10) {
    throw new Error("question " + id + " score criteria must contain 2 to 10 levels");
  }
  for (const value of question.criteria) {
    if (!isTextOrStructured(value)) throw new Error("question " + id + " score criteria levels must be strings, objects or arrays");
  }
}

function validateRequest(body) {
  const model = String(body.model || "").trim();
  if (!MODELS.includes(model)) throw new Error("model must be jev-latest, jev-preview or jev-1.13.0");
  if (!isTextOrStructured(body.state) || !isJsonValue(body.state)) {
    throw new Error("state must be a string, object or array");
  }
  if (!isObject(body.questions) || Object.keys(body.questions).length === 0) {
    throw new Error("questions must be a non-empty object");
  }
  if (body.stream !== undefined && body.stream !== false) throw new Error("Jev decisions do not support streaming");
  for (const [id, question] of Object.entries(body.questions)) validateQuestion(id, question);
  return model;
}

function validateProbabilityMap(probabilities, criteria, label) {
  if (!isObject(probabilities) || Object.keys(probabilities).length !== Object.keys(criteria).length) {
    throw new Error(label + " probabilities do not match criteria");
  }
  let sum = 0;
  for (const key of Object.keys(criteria)) {
    const value = probabilities[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(label + " probabilities contain an invalid value");
    }
    sum += value;
  }
  if (Math.abs(sum - 1) > 1e-4) throw new Error(label + " probabilities must sum to 1");
}

function validateAnswer(id, question, answer) {
  if (!isObject(answer) || answer.type !== question.type) throw new Error("answer " + id + " has an invalid type");
  if (question.type === "noul") {
    if (typeof answer.noul !== "number" || !Number.isFinite(answer.noul) || answer.noul < 0 || answer.noul > 1) {
      throw new Error("answer " + id + " noul must be between 0 and 1");
    }
    return;
  }

  if (typeof answer.confidence !== "number" || !Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) {
    throw new Error("answer " + id + " confidence must be between 0 and 1");
  }

  if (question.type === "choice") {
    if (typeof answer.choice !== "string" || !Object.prototype.hasOwnProperty.call(question.criteria, answer.choice)) {
      throw new Error("answer " + id + " choice is not one of the requested options");
    }
    validateProbabilityMap(answer.probabilities, question.criteria, "answer " + id);
    return;
  }

  if (typeof answer.score !== "number" || !Number.isFinite(answer.score) || answer.score < 0 || answer.score > question.criteria.length - 1) {
    throw new Error("answer " + id + " score is outside the requested levels");
  }
  const levels = {};
  for (let i = 0; i < question.criteria.length; i += 1) levels[String(i)] = true;
  validateProbabilityMap(answer.probabilities, levels, "answer " + id);
  if (!isObject(answer.legend) || Object.keys(answer.legend).length !== question.criteria.length) {
    throw new Error("answer " + id + " legend does not match criteria");
  }
  for (let i = 0; i < question.criteria.length; i += 1) {
    const level = String(i);
    if (typeof answer.legend[level] !== "string") throw new Error("answer " + id + " legend must contain strings");
    // TypeSafe's wire format uses strings in legend. When the request criterion
    // is a string, require an exact match to prevent relabeled score levels.
    if (typeof question.criteria[i] === "string" && answer.legend[level] !== question.criteria[i]) {
      throw new Error("answer " + id + " legend does not match criteria");
    }
  }
}

function validateResponse(body, request) {
  if (!isObject(body) || typeof body.model !== "string" || !isObject(body.answers) || !isObject(body.usage)) {
    throw new Error("TypeSafe returned an invalid response");
  }
  const input = body.usage.input_tokens;
  const output = body.usage.output_tokens;
  if (!Number.isSafeInteger(input) || input < 0 || !Number.isSafeInteger(output) || output < 0) {
    throw new Error("TypeSafe returned invalid token usage");
  }
  const ids = Object.keys(request.questions);
  if (Object.keys(body.answers).length !== ids.length) throw new Error("TypeSafe did not return one answer per question");
  for (const id of ids) {
    if (!Object.prototype.hasOwnProperty.call(body.answers, id)) throw new Error("TypeSafe omitted answer " + id);
    validateAnswer(id, request.questions[id], body.answers[id]);
  }
}

export const native = {
  createJob(ctx) {
    const body = requireJsonObject(ctx);
    validateRequest(body);
    return { kind: "submit", model: body.model, requestBody: body };
  },

  jobCreated(_ctx, task) {
    return task && task.data && isObject(task.data) ? task.data : {};
  },

  error(_ctx, error) {
    return { code: error.code, message: error.message };
  },
};

export function buildSubmitRequest(ctx) {
  const request = ctx.requestBody || {};
  validateRequest(request);
  return {
    url: String(ctx.baseUrl || "https://api.typesafe.ai").replace(/\/+$/, "") + "/v1/systemone",
    method: "POST",
    headers: {
      Authorization: "Bearer " + ctx.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: {
      model: request.model,
      state: request.state,
      questions: request.questions,
    },
  };
}

export function parseSubmitResponse(_ctx, resp) {
  const body = resp && resp.body;
  if (!isObject(body)) throw new Error("TypeSafe returned an invalid JSON response");
  const request = _ctx.requestBody || {};
  validateResponse(body, request);
  return {
    taskId: "jev-" + (typeof utils !== "undefined" && utils.uuid ? utils.uuid() : String(Date.now())),
    taskData: body,
    immediate: { status: "SUCCESS" },
  };
}

// Required by Task Plugin API v1 for submit routes. Jev responses are
// synchronous and return `immediate`, so the host should never call this hook.
// Keep the hook explicit and fail closed if a gateway tries to poll anyway.
export function buildQueryRequest(_ctx) {
  throw new Error("TypeSafe Jev tasks are synchronous and do not support polling");
}

export function parseTaskResult(_ctx, _body) {
  return {
    status: "FAILURE",
    reason: "TypeSafe Jev returned no immediate result; polling is unsupported",
  };
}

// Do not estimate a charge from the request. The provider-reported usage is
// authoritative and is applied by extractUsageOnComplete for immediate tasks.
export function extractUsage(_ctx) {
  return {};
}

export function extractUsageOnComplete(_task, _taskResult, body) {
  if (!isObject(body) || !isObject(body.usage)) throw new Error("TypeSafe usage is missing");
  const input = body.usage.input_tokens;
  const output = body.usage.output_tokens;
  if (!Number.isSafeInteger(input) || input < 0 || !Number.isSafeInteger(output) || output < 0) {
    throw new Error("TypeSafe usage is invalid");
  }
  return { input_tokens: input, output_tokens: output };
}
