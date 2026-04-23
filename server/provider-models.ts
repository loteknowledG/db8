export type ProviderKey = "opencode" | "openrouter" | "openai";

export type ModelOption = {
  id: string;
  label: string;
  provider: ProviderKey;
  isFree: boolean;
};

type ProviderConfig = {
  label: string;
  modelsUrl: string;
};

type ModelRecord = Record<string, unknown>;

const providerConfig: Record<ProviderKey, ProviderConfig> = {
  opencode: {
    label: "OpenCode",
    modelsUrl: "https://opencode.ai/zen/v1/models",
  },
  openrouter: {
    label: "OpenRouter",
    modelsUrl: "https://openrouter.ai/api/v1/models",
  },
  openai: {
    label: "OpenAI",
    modelsUrl: "https://api.openai.com/v1/models",
  },
};

function toArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== "object") return [];

  const data = (payload as { data?: unknown; models?: unknown }).data;
  if (Array.isArray(data)) return data;

  const models = (payload as { models?: unknown }).models;
  if (Array.isArray(models)) return models;

  return [];
}

function normalizeLabel(model: Record<string, unknown>, id: string): string {
  const displayName = model.display_name;
  const name = model.name;

  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return id;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isFreeModel(model: ModelRecord, id: string, label: string): boolean {
  const directFlags = [model.is_free, model.free, model.free_tier, model.freeTier, model.isFree];

  if (directFlags.some((flag) => flag === true)) {
    return true;
  }

  const pricing = model.pricing;
  if (pricing && typeof pricing === "object") {
    const pricingRecord = pricing as Record<string, unknown>;
    const numericPrices = [
      pricingRecord.prompt,
      pricingRecord.completion,
      pricingRecord.request,
      pricingRecord.input,
      pricingRecord.output,
      pricingRecord.price,
      pricingRecord.cost,
      pricingRecord.input_cost,
      pricingRecord.output_cost,
    ]
      .map(readNumber)
      .filter((value): value is number => value !== null);

    if (numericPrices.length > 0 && numericPrices.every((price) => price === 0)) {
      return true;
    }
  }

  const text = `${id} ${label}`.toLowerCase();
  return text.includes("free");
}

export function normalizeModels(provider: ProviderKey, payload: unknown): ModelOption[] {
  const rawModels = toArray(payload);

  return rawModels
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const model = entry as Record<string, unknown>;
      const id =
        typeof model.id === "string"
          ? model.id.trim()
          : typeof model.model_id === "string"
            ? model.model_id.trim()
            : typeof model.modelId === "string"
              ? model.modelId.trim()
              : typeof model.name === "string"
                ? model.name.trim()
                : "";

      if (!id) return null;

      const label = normalizeLabel(model, id);

      return {
        id,
        label,
        provider,
        isFree: isFreeModel(model, id, label),
      } satisfies ModelOption;
    })
    .filter((model): model is ModelOption => Boolean(model))
    .sort((left, right) => {
      if (left.isFree !== right.isFree) {
        return left.isFree ? -1 : 1;
      }

      return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
    });
}

export async function fetchProviderModels(
  provider: ProviderKey,
  apiKey: string,
): Promise<ModelOption[]> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error("Missing API key");
  }

  const config = providerConfig[provider];
  const response = await fetch(config.modelsUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(
      `${config.label} models endpoint error ${response.status}: ${bodyText || response.statusText}`,
    );
  }

  let payload: unknown = null;
  try {
    payload = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    payload = null;
  }

  return normalizeModels(provider, payload);
}
