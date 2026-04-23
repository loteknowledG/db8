export type ProviderKey = "opencode" | "openrouter" | "openai";
export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export type ModelOption = {
  id: string;
  label: string;
  provider: ProviderKey;
  isFree: boolean;
};

export const providerOrder: ProviderKey[] = ["opencode", "openrouter", "openai"];

export const providerLabels: Record<ProviderKey, string> = {
  opencode: "OpenCode",
  openrouter: "OpenRouter",
  openai: "OpenAI",
};

export function normalizeModels(provider: ProviderKey, payload: unknown): ModelOption[] {
  const items: unknown[] = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? Array.isArray((payload as { models?: unknown }).models)
        ? ((payload as { models: unknown[] }).models ?? [])
        : Array.isArray((payload as { data?: unknown }).data)
          ? ((payload as { data: unknown[] }).data ?? [])
          : []
      : [];

  return items
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

      const label =
        typeof model.display_name === "string" && model.display_name.trim()
          ? model.display_name.trim()
          : typeof model.name === "string" && model.name.trim()
            ? model.name.trim()
            : id;

      return {
        id,
        label,
        provider,
        isFree: Boolean(model.isFree) || `${id} ${label}`.toLowerCase().includes("free"),
      } satisfies ModelOption;
    })
    .filter((model): model is ModelOption => Boolean(model));
}

export function connectionTone(status: ConnectionStatus): string {
  switch (status) {
    case "connected":
      return "text-green-500";
    case "connecting":
      return "text-amber-500";
    case "error":
      return "text-rose-500";
    default:
      return "text-muted-foreground";
  }
}
