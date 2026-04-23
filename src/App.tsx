import * as React from "react";

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from "realmorphism";

type ServerId = "ana" | "bui" | "arc" | "hum";
type SectionId = "conversation" | "connections" | "memory";
type ProviderKey = "opencode" | "openrouter" | "openai";
type ConnectionStatus = "idle" | "scanning" | "connected" | "partial" | "error";

type ModelOption = {
  id: string;
  label: string;
  provider: ProviderKey;
  isFree: boolean;
};

type ModelHealth = "idle" | "testing" | "green" | "amber" | "grey";
type ChatSender = ServerId | "human" | "system";
type ThemeMode = "light" | "dark" | "color";

type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
};

type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ServerState = {
  provider: ProviderKey;
  key: string;
  model: string;
  conversation: string;
  memory: string;
  message: string;
  draft: string;
  chatLog: ChatMessage[];
  note: string;
  models: ModelOption[];
  modelHealth: Record<string, ModelHealth>;
  status: ConnectionStatus;
};

type ServerMeta = {
  id: ServerId;
  label: string;
  title: string;
  subtitle: string;
  summary: string;
};

const THEME_STORAGE_KEY = "db8-theme";
const ACTIVE_SERVER_STORAGE_KEY = "db8-active-server";
const ACTIVE_SECTION_STORAGE_KEY = "db8-active-section";
const CUSTOM_TITLE_STORAGE_KEY = "db8-custom-titles";
const SERVER_KEY_STORAGE_PREFIX = "db8-server-key-";
const SERVER_PROVIDER_STORAGE_PREFIX = "db8-server-provider-";
const SERVER_MODEL_STORAGE_PREFIX = "db8-server-model-";
const SERVER_MODELS_STORAGE_PREFIX = "db8-server-models-";
const SERVER_MODEL_HEALTH_STORAGE_PREFIX = "db8-server-model-health-";
const SERVER_STATUS_STORAGE_PREFIX = "db8-server-status-";
const SERVER_MESSAGE_STORAGE_PREFIX = "db8-server-message-";
const SERVER_DRAFT_STORAGE_PREFIX = "db8-server-draft-";
const SERVER_CHAT_LOG_STORAGE_PREFIX = "db8-server-chat-log-";

const serverOrder: ServerId[] = ["ana", "bui", "arc", "hum"];
const aiRelayOrder: Exclude<ServerId, "hum">[] = ["ana", "bui", "arc"];
const maxRelayWaves = 2;
const sectionOrder: SectionId[] = ["conversation", "connections"];
const sectionLabels: Record<Exclude<SectionId, "memory">, string> = {
  conversation: "Convo",
  connections: "LLM",
};
const providerOrder: ProviderKey[] = ["opencode", "openrouter", "openai"];

const providerLabels: Record<ProviderKey, string> = {
  opencode: "OpenCode",
  openrouter: "OpenRouter",
  openai: "OpenAI",
};

const serverMeta: Record<ServerId, ServerMeta> = {
  ana: {
    id: "ana",
    label: "NOVA",
    title: "Nova",
    subtitle: "Signal compression",
    summary: "Keeps the room focused on the useful slice of the transcript.",
  },
  bui: {
    id: "bui",
    label: "FORGE",
    title: "Forge",
    subtitle: "Structure and repair",
    summary: "Turns the room into small, testable steps instead of a giant rewrite.",
  },
  arc: {
    id: "arc",
    label: "VAULT",
    title: "Vault",
    subtitle: "Memory retention",
    summary: "Tracks the shortest useful version of the room state.",
  },
  hum: {
    id: "hum",
    label: "HUMAN",
    title: "Human",
    subtitle: "Interrupts and judgment",
    summary: "Lets the person in the loop steer whenever the room needs a decision.",
  },
};

const serverSeed: Record<ServerId, Omit<ServerState, "models" | "status">> = {
  ana: {
    provider: "opencode",
    key: "",
    model: "trinity-large-preview-free",
    conversation:
      "I can keep the room focused on the actual signal instead of replaying the whole transcript.",
    memory:
      "Persona pack: Analyst, turn-summarizer.\nSkills: signal compression, fact checks, tight response framing.",
    chatLog: [],
    draft: "",
    note: "Lean into compact turn summaries.",
  },
  bui: {
    provider: "openrouter",
    key: "",
    model: "claude-opus-4",
    conversation: "The room can hear, decide, and answer without making the user type a prompt.",
    memory:
      "Persona pack: Builder, implementation guard.\nSkills: structure, scaffolding, repair loops.",
    chatLog: [],
    draft: "",
    note: "Keep the room shell small and reliable.",
  },
  arc: {
    provider: "openai",
    key: "",
    model: "gpt-4o-mini",
    conversation:
      "I saved that as a memory seed: short turns, clean state, and one clear speaker at a time.",
    memory:
      "Persona pack: Archivist, memory seed keeper.\nSkills: retrieval, condensation, context recovery.",
    chatLog: [],
    draft: "",
    note: "Preserve the shortest useful version.",
  },
  hum: {
    provider: "openai",
    key: "",
    model: "manual",
    conversation: "You can speak, type, or jump in when the room needs a human decision.",
    memory: "Persona pack: Human in the loop.\nSkills: judgment, consent, interruption, direction.",
    message: "Human can interrupt the loop anytime.",
    draft: "",
    chatLog: [],
    note: "Human can interrupt the loop anytime.",
  },
};

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "color") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredServer(): ServerId {
  if (typeof window === "undefined") return "ana";

  const stored = window.localStorage.getItem(ACTIVE_SERVER_STORAGE_KEY);
  return serverOrder.includes(stored as ServerId) ? (stored as ServerId) : "ana";
}

function readStoredSection(): SectionId {
  if (typeof window === "undefined") return "conversation";

  const stored = window.localStorage.getItem(ACTIVE_SECTION_STORAGE_KEY);
  return sectionOrder.includes(stored as SectionId) ? (stored as SectionId) : "conversation";
}

function readStoredCustomTitles(): Partial<Record<ServerId, string>> {
  if (typeof window === "undefined") return {};

  const stored = window.localStorage.getItem(CUSTOM_TITLE_STORAGE_KEY);
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored) as Partial<Record<ServerId, unknown>>;
    return serverOrder.reduce<Partial<Record<ServerId, string>>>((acc, serverId) => {
      const value = parsed[serverId];
      if (typeof value === "string" && value.trim()) {
        acc[serverId] = value.trim();
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function readStoredServerKey(serverId: ServerId): string {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(`${SERVER_KEY_STORAGE_PREFIX}${serverId}`) || "";
}

function readStoredServerProvider(serverId: ServerId): ProviderKey | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(`${SERVER_PROVIDER_STORAGE_PREFIX}${serverId}`);
  return providerOrder.includes(stored as ProviderKey) ? (stored as ProviderKey) : null;
}

function readStoredServerModel(serverId: ServerId): string {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(`${SERVER_MODEL_STORAGE_PREFIX}${serverId}`) || "";
}

function readStoredServerModels(serverId: ServerId): ModelOption[] {
  if (typeof window === "undefined") return [];

  const stored = window.localStorage.getItem(`${SERVER_MODELS_STORAGE_PREFIX}${serverId}`);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored) as unknown[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const model = entry as Record<string, unknown>;
        if (typeof model.id !== "string" || typeof model.label !== "string") return null;

        return {
          id: model.id,
          label: model.label,
          provider:
            model.provider === "opencode" ||
            model.provider === "openrouter" ||
            model.provider === "openai"
              ? model.provider
              : serverSeed.ana.provider,
          isFree: Boolean(model.isFree),
        } satisfies ModelOption;
      })
      .filter((model): model is ModelOption => Boolean(model));
  } catch {
    return [];
  }
}

function readStoredServerModelHealth(serverId: ServerId): Record<string, ModelHealth> {
  if (typeof window === "undefined") return {};

  const stored = window.localStorage.getItem(`${SERVER_MODEL_HEALTH_STORAGE_PREFIX}${serverId}`);
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Record<string, ModelHealth>>((acc, [id, value]) => {
      if (
        typeof id === "string" &&
        (value === "idle" ||
          value === "testing" ||
          value === "green" ||
          value === "amber" ||
          value === "grey")
      ) {
        acc[id] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function readStoredServerMessage(serverId: ServerId): string {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(`${SERVER_MESSAGE_STORAGE_PREFIX}${serverId}`) || "";
}

function readStoredServerDraft(serverId: ServerId): string {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(`${SERVER_DRAFT_STORAGE_PREFIX}${serverId}`) || "";
}

function readStoredServerChatLog(serverId: ServerId): ChatMessage[] {
  if (typeof window === "undefined") return [];

  const stored = window.localStorage.getItem(`${SERVER_CHAT_LOG_STORAGE_PREFIX}${serverId}`);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored) as unknown[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const message = entry as Record<string, unknown>;
        const sender = message.sender;

        if (
          typeof message.id !== "string" ||
          typeof message.text !== "string" ||
          (sender !== "human" &&
            sender !== "system" &&
            sender !== "ana" &&
            sender !== "bui" &&
            sender !== "arc" &&
            sender !== "hum")
        ) {
          return null;
        }

        return {
          id: message.id,
          sender,
          text: message.text,
        } satisfies ChatMessage;
      })
      .filter((message): message is ChatMessage => Boolean(message));
  } catch {
    return [];
  }
}

function readStoredServerStatus(serverId: ServerId): ConnectionStatus {
  if (typeof window === "undefined") return "idle";

  const stored = window.localStorage.getItem(`${SERVER_STATUS_STORAGE_PREFIX}${serverId}`);
  return stored === "connected" || stored === "partial" || stored === "error" || stored === "idle"
    ? stored
    : "idle";
}

function getThemeShellClass(theme: ThemeMode) {
  if (theme === "dark") {
    return "bg-[radial-gradient(circle_at_top,_rgba(63,63,70,0.38),_transparent_34%),linear-gradient(180deg,_#09090b_0%,_#111114_44%,_#0c0c0d_100%)] text-foreground";
  }

  if (theme === "color") {
    return "bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.24),_transparent_44%),linear-gradient(180deg,_#0f172a_0%,_#111827_48%,_#020617_100%)] text-foreground";
  }

  return "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.82),_transparent_30%),linear-gradient(180deg,_#f8f7f4_0%,_#eee8dd_44%,_#e4dccf_100%)] text-foreground";
}

function normalizeModels(provider: ProviderKey, payload: unknown): ModelOption[] {
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
        isFree: Boolean(model.isFree),
      } satisfies ModelOption;
    })
    .filter((model): model is ModelOption => Boolean(model));
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3a9 9 0 1 0 9 9c0-.36-.02-.72-.07-1.07A7 7 0 0 1 12 3Z" />
    </svg>
  );
}

function PaletteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 22a10 10 0 1 1 10-10 4 4 0 0 1-4 4h-1.5a2.5 2.5 0 0 0 0 5H12Z" />
      <circle cx="7.5" cy="10" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16.5" cy="10" r="1" />
    </svg>
  );
}

function PlugConnectedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 7v6" />
      <path d="M15 7v6" />
      <path d="M8 12h8" />
      <path d="M12 13v4" />
      <path d="M10 17h4" />
      <path d="M8 5h8" />
    </svg>
  );
}

function getConnectionStatusLabel(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return "connected";
    case "partial":
      return "partial";
    case "scanning":
      return "connecting";
    case "error":
      return "failed";
    default:
      return "not tested";
  }
}

function getConnectionStatusTone(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return "text-green-500";
    case "partial":
    case "scanning":
      return "text-amber-500";
    case "error":
      return "text-rose-500";
    default:
      return "text-muted-foreground";
  }
}

type ConnectionPanelProps = {
  state: ServerState;
  activeModels: ModelOption[];
  onSetProvider: (provider: ProviderKey) => void;
  onPatchState: (patch: Partial<ServerState>) => void;
  onConnect: (overrideKey?: string) => void;
  onProbeModel: (modelId: string) => void;
  onStatusAction?: () => void;
  statusActionLabel?: string;
};

function ConnectionPanel({
  state,
  activeModels,
  onSetProvider,
  onPatchState,
  onConnect,
  onProbeModel,
  onStatusAction,
  statusActionLabel,
}: ConnectionPanelProps) {
  const isConnected = state.status === "connected";
  const statusLabel = getConnectionStatusLabel(state.status);
  const statusTone = getConnectionStatusTone(state.status);
  const instructionMessage = !state.key.trim()
    ? "Paste a key to test the connection automatically."
    : state.status === "partial"
      ? state.model
        ? "Choose a different model to test."
        : "Select a model to test."
      : state.status === "scanning"
        ? "The room is probing the provider for models."
        : state.status === "error"
          ? "Check the key and try again."
          : "Paste a key to test the connection automatically.";
  const statusContent = (
    <span className="inline-flex items-center gap-1.5">
      <PlugConnectedIcon className="size-4 shrink-0" aria-hidden="true" />
      <span>Connection status</span>
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="db8-shine-border" data-connected={isConnected ? "true" : "false"}>
        <div className="db8-shine-border__inner grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="db8-field-group">
            <span className="db8-field-label">Provider</span>
            <select
              className="db8-field db8-select"
              value={state.provider}
              onChange={(event) => onSetProvider(event.target.value as ProviderKey)}
            >
              {providerOrder.map((provider) => (
                <option key={provider} value={provider}>
                  {providerLabels[provider]}
                </option>
              ))}
            </select>
          </label>

          <label className="db8-field-group">
            <span className="db8-field-label">Gateway key</span>
            <input
              className="db8-field db8-input"
              type="password"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={state.key}
              onChange={(event) => onPatchState({ key: event.target.value, status: "idle" })}
              onPaste={(event) => {
                const pastedKey = event.clipboardData.getData("text").trim();
                if (!pastedKey) return;

                event.preventDefault();
                onPatchState({ key: pastedKey, status: "idle" });
                 onConnect(pastedKey);
              }}
              placeholder={`Add ${providerLabels[state.provider]} key`}
            />
          </label>

          <div className="db8-field-group sm:self-end">
            <span className="db8-field-label sm:opacity-0">Connect</span>
            <Button
              type="button"
              variant="outline"
              className="inline-flex h-11 w-11 items-center justify-center px-0"
              onClick={() => onConnect()}
              aria-label="Connect provider"
            >
              <PlugConnectedIcon className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <label className="db8-field-group">
        <span className="db8-field-label">Model</span>
        <select
          className="db8-field db8-select"
          value={state.model}
          onChange={(event) => {
             onProbeModel(event.target.value);
          }}
          disabled={!activeModels.length}
        >
          {activeModels.length ? (
            <>
              <option value="">Select a model to test</option>
              {activeModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </>
          ) : (
            <option value="">
              {state.status === "connected" || state.status === "partial"
                ? "Loading models..."
                : "Connect provider first"}
            </option>
          )}
        </select>
      </label>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">
            {onStatusAction ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-left shadow-[2px_2px_0_1px_var(--button-wall)] transition-[transform,box-shadow] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_1px_var(--button-wall)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                onClick={onStatusAction}
                aria-label={statusActionLabel ?? "Open connection panel"}
              >
                {statusContent}
              </button>
            ) : (
              statusContent
            )}
            <span className={`font-semibold tracking-[0.18em] ${statusTone}`}>{statusLabel}</span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {state.status === "connected" ? null : instructionMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = React.useState<ThemeMode>(readStoredTheme);
  const [activeServer, setActiveServer] = React.useState<ServerId>(readStoredServer);
  const [activeSection, setActiveSection] = React.useState<SectionId>(readStoredSection);
  const [customTitles, setCustomTitles] =
    React.useState<Partial<Record<ServerId, string>>>(readStoredCustomTitles);
  const [editingTitleServer, setEditingTitleServer] = React.useState<ServerId | null>(null);
  const [titleDraft, setTitleDraft] = React.useState("");
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = React.useState(false);
  const [serverState, setServerState] = React.useState<Record<ServerId, ServerState>>(() => {
    return {
      ana: {
        ...serverSeed.ana,
        provider: readStoredServerProvider("ana") ?? serverSeed.ana.provider,
        key: readStoredServerKey("ana"),
        model: readStoredServerModel("ana"),
        models: readStoredServerModels("ana"),
        modelHealth: readStoredServerModelHealth("ana"),
        message: readStoredServerMessage("ana"),
        draft: readStoredServerDraft("ana"),
        chatLog: readStoredServerChatLog("ana"),
        status: readStoredServerStatus("ana"),
      },
      bui: {
        ...serverSeed.bui,
        provider: readStoredServerProvider("bui") ?? serverSeed.bui.provider,
        key: readStoredServerKey("bui"),
        model: readStoredServerModel("bui"),
        models: readStoredServerModels("bui"),
        modelHealth: readStoredServerModelHealth("bui"),
        message: readStoredServerMessage("bui"),
        draft: readStoredServerDraft("bui"),
        chatLog: readStoredServerChatLog("bui"),
        status: readStoredServerStatus("bui"),
      },
      arc: {
        ...serverSeed.arc,
        provider: readStoredServerProvider("arc") ?? serverSeed.arc.provider,
        key: readStoredServerKey("arc"),
        model: readStoredServerModel("arc"),
        models: readStoredServerModels("arc"),
        modelHealth: readStoredServerModelHealth("arc"),
        message: readStoredServerMessage("arc"),
        draft: readStoredServerDraft("arc"),
        chatLog: readStoredServerChatLog("arc"),
        status: readStoredServerStatus("arc"),
      },
      hum: {
        ...serverSeed.hum,
        provider: readStoredServerProvider("hum") ?? serverSeed.hum.provider,
        key: readStoredServerKey("hum"),
        model: readStoredServerModel("hum"),
        models: readStoredServerModels("hum"),
        modelHealth: readStoredServerModelHealth("hum"),
        message: readStoredServerMessage("hum"),
        draft: readStoredServerDraft("hum"),
        chatLog: readStoredServerChatLog("hum"),
        status: readStoredServerStatus("hum"),
      },
    };
  });

  React.useEffect(() => {
    document.documentElement.classList.remove("dark", "color");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
    if (theme === "color") {
      document.documentElement.classList.add("color");
    }
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  React.useEffect(() => {
    window.localStorage.setItem(ACTIVE_SERVER_STORAGE_KEY, activeServer);
  }, [activeServer]);

  React.useEffect(() => {
    window.localStorage.setItem(ACTIVE_SECTION_STORAGE_KEY, activeSection);
  }, [activeSection]);

  React.useEffect(() => {
    window.localStorage.setItem(CUSTOM_TITLE_STORAGE_KEY, JSON.stringify(customTitles));
  }, [customTitles]);

  React.useEffect(() => {
    setEditingTitleServer(null);
    setTitleDraft(customTitles[activeServer]?.trim() || serverMeta[activeServer].title);
  }, [activeServer, customTitles]);

  const activeMeta = serverMeta[activeServer];
  const activeState = serverState[activeServer];
  const activeTitle = customTitles[activeServer]?.trim() || activeMeta.title;
  const nextThemeLabel = theme === "light" ? "dark" : theme === "dark" ? "color" : "light";
  const getServerTitle = React.useCallback(
    (serverId: ServerId) => customTitles[serverId]?.trim() || serverMeta[serverId].title,
    [customTitles],
  );

  const patchServer = React.useCallback((serverId: ServerId, patch: Partial<ServerState>) => {
    setServerState((current) => ({
      ...current,
      [serverId]: {
        ...current[serverId],
        ...patch,
      },
    }));

    if (typeof patch.key === "string") {
      window.localStorage.setItem(`${SERVER_KEY_STORAGE_PREFIX}${serverId}`, patch.key);
    }
    if (typeof patch.provider === "string") {
      window.localStorage.setItem(`${SERVER_PROVIDER_STORAGE_PREFIX}${serverId}`, patch.provider);
    }
    if (typeof patch.model === "string") {
      window.localStorage.setItem(`${SERVER_MODEL_STORAGE_PREFIX}${serverId}`, patch.model);
    }
    if (Array.isArray(patch.chatLog)) {
      window.localStorage.setItem(
        `${SERVER_CHAT_LOG_STORAGE_PREFIX}${serverId}`,
        JSON.stringify(patch.chatLog),
      );
    }
    if (Array.isArray(patch.models)) {
      window.localStorage.setItem(
        `${SERVER_MODELS_STORAGE_PREFIX}${serverId}`,
        JSON.stringify(patch.models),
      );
    }
    if (patch.modelHealth && typeof patch.modelHealth === "object") {
      window.localStorage.setItem(
        `${SERVER_MODEL_HEALTH_STORAGE_PREFIX}${serverId}`,
        JSON.stringify(patch.modelHealth),
      );
    }
    if (typeof patch.message === "string") {
      window.localStorage.setItem(`${SERVER_MESSAGE_STORAGE_PREFIX}${serverId}`, patch.message);
    }
    if (typeof patch.draft === "string") {
      window.localStorage.setItem(`${SERVER_DRAFT_STORAGE_PREFIX}${serverId}`, patch.draft);
    }
    if (typeof patch.status === "string") {
      window.localStorage.setItem(`${SERVER_STATUS_STORAGE_PREFIX}${serverId}`, patch.status);
    }
  }, []);

  const connectProvider = async (serverId: ServerId, overrideKey?: string) => {
    const snapshot = serverState[serverId];
    const apiKey = (overrideKey ?? snapshot.key).trim();

    if (!apiKey) {
      patchServer(serverId, { status: "error" });
      return;
    }

    patchServer(serverId, { status: "scanning" });

    try {
      const response = await fetch(`/api/models?provider=${snapshot.provider}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to connect (status ${response.status})`);
      }

      const payload = await response.json().catch(() => null);
      const models = normalizeModels(snapshot.provider, payload);
      const nextModel = snapshot.model
        ? (models.find((model) => model.id === snapshot.model) ?? null)
        : null;
      const nextModelHealth = models.reduce<Record<string, ModelHealth>>((acc, model) => {
        const storedHealth = snapshot.modelHealth[model.id];
        acc[model.id] = storedHealth && storedHealth !== "testing" ? storedHealth : "idle";
        return acc;
      }, {});

      patchServer(serverId, {
        key: apiKey,
        models,
        modelHealth: {
          ...nextModelHealth,
          ...(nextModel ? { [nextModel.id]: "testing" as ModelHealth } : {}),
        },
        model: nextModel?.id ?? "",
        status: nextModel ? "scanning" : "partial",
      });

      if (nextModel) {
        const probeResponse = await fetch("/api/probe", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: snapshot.provider,
            model: nextModel.id,
          }),
        });

        if (!probeResponse.ok) {
          const text = await probeResponse.text();
          throw new Error(text || `Model probe failed (status ${probeResponse.status})`);
        }

        const probePayload = await probeResponse.json().catch(() => null);
        if (!probePayload?.ok) {
          throw new Error("Model probe returned an empty response");
        }

        patchServer(serverId, {
          models,
          modelHealth: {
            ...nextModelHealth,
            [nextModel.id]: "green",
          },
          status: "connected",
        });
      }
    } catch {
      patchServer(serverId, { status: "partial" });
    }
  };

  React.useEffect(() => {
    const needsModelRefresh =
      activeState.status === "connected" &&
      Boolean(activeState.key.trim()) &&
      activeState.models.length === 0;

    if (needsModelRefresh) {
      void connectProvider(activeServer);
    }
  }, [activeServer, activeState.key, activeState.models.length, activeState.status]);

  const setProvider = (serverId: ServerId, provider: ProviderKey) => {
    patchServer(serverId, {
      provider,
      status: "idle",
      models: [],
      model: "",
      modelHealth: {},
    });
  };

  const probeModel = async (serverId: ServerId, modelId: string) => {
    const snapshot = serverState[serverId];
    const apiKey = snapshot.key.trim();

    if (!apiKey || !modelId) {
      patchServer(serverId, { status: "partial" });
      return;
    }

    patchServer(serverId, { model: modelId, status: "scanning" });
    patchServer(serverId, {
      modelHealth: {
        ...serverState[serverId].modelHealth,
        [modelId]: "testing",
      },
    });

    try {
      const response = await fetch("/api/probe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: snapshot.provider,
          model: modelId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Model probe failed (status ${response.status})`);
      }

      const payload = await response.json().catch(() => null);
      if (!payload?.ok) {
        throw new Error("Model probe returned an empty response");
      }

      patchServer(serverId, {
        status: "connected",
        modelHealth: {
          ...serverState[serverId].modelHealth,
          [modelId]: "green",
        },
      });
    } catch {
      patchServer(serverId, {
        status: "error",
        modelHealth: {
          ...serverState[serverId].modelHealth,
          [modelId]: "grey",
        },
      });
    }
  };

  const commitTitle = () => {
    const nextTitle = titleDraft.trim();
    setCustomTitles((current) => {
      const next = { ...current };
      if (nextTitle) {
        next[activeServer] = nextTitle;
      } else {
        delete next[activeServer];
      }
      return next;
    });
    setEditingTitleServer(null);
  };

  const activeModels = activeState.models;
  const appendChatEntry = React.useCallback((serverId: ServerId, entry: ChatMessage) => {
    setServerState((current) => {
      const nextChatLog = [...current[serverId].chatLog, entry];

      window.localStorage.setItem(
        `${SERVER_CHAT_LOG_STORAGE_PREFIX}${serverId}`,
        JSON.stringify(nextChatLog),
      );

      return {
        ...current,
        [serverId]: {
          ...current[serverId],
          chatLog: nextChatLog,
        },
      };
    });
  }, []);

  const detectPromptDomain = (prompt: string) => {
    const lower = prompt.toLowerCase();

    if (lower.includes("connection")) return "connection path";
    if (lower.includes("model")) return "model selection";
    if (lower.includes("memory")) return "memory trail";
    if (lower.includes("relay") || lower.includes("hive")) return "relay chain";
    if (lower.includes("chat") || lower.includes("conversation")) return "room conversation";
    if (lower.includes("human")) return "human-side prompt";

    return "room signal";
  };

  const buildAutoReply = (serverId: Exclude<ServerId, "hum">, prompt: string) => {
    const domain = detectPromptDomain(prompt);

    switch (serverId) {
      case "ana":
        return `${serverMeta.ana.title}: I’m compressing this into the useful core of the ${domain}.`;
      case "bui":
        return `${serverMeta.bui.title}: I’d turn the ${domain} into one concrete next move.`;
      case "arc":
        return `${serverMeta.arc.title}: I’m storing the cleanest version of the ${domain} and dropping the noise.`;
    }
  };

  const buildRelayMessages = (serverId: Exclude<ServerId, "hum">) => {
    const snapshot = serverState[serverId];
    const transcript = snapshot.chatLog.slice(0, -1).slice(-8);
    const roleInstructions: Record<Exclude<ServerId, "hum">, string> = {
      ana: "Nova compresses the room into a sharp thesis, then asks one pressure-testing question that forces the next turn to move forward.",
      bui: "Forge turns the room into a concrete next step, challenges vague claims, and names the smallest actionable move.",
      arc: "Vault records the cleanest version of the debate, corrects drift, and converts the latest turn into a durable rule or decision.",
    };

    const baseMessages: ChatCompletionMessage[] = [
      {
        role: "system",
        content:
          `You are ${serverMeta[serverId].title} in DB8, a three-AI hive-mind debate room. ` +
          `Stay in character, keep the response concise, and advance the discussion instead of echoing the prompt. ` +
          `Treat Human as the operator and the other AIs as debate partners. ` +
          `Your job is to move the argument somewhere new every turn.`,
      },
      {
        role: "system",
        content:
          `Role move:\n${roleInstructions[serverId]}\n\n` +
          `Private stance:\n${snapshot.memory}\n\n` +
          `Room posture:\n${snapshot.conversation}\n\n` +
          `Working note:\n${snapshot.note}\n\n` +
          `Debate rules:\n- Do not mirror the last speaker word-for-word.\n- Respond to the most recent non-system message.\n- Either challenge, refine, or redirect the conversation.\n- End with a concrete question, claim, or next step that invites the next AI to continue.`,
      },
    ];

    const transcriptMessages = transcript.map<ChatCompletionMessage>((entry) => {
      if (entry.sender === "system") {
        return { role: "system", content: entry.text };
      }

      if (entry.sender === "human") {
        return { role: "user", content: entry.text };
      }

      return {
        role: "assistant",
        content: `${serverMeta[entry.sender].title}: ${entry.text}`,
      };
    });

    return [...baseMessages, ...transcriptMessages];
  };

  const requestRelayReply = async (serverId: Exclude<ServerId, "hum">) => {
    const snapshot = serverState[serverId];
    const apiKey = snapshot.key.trim();
    const modelId = snapshot.model.trim();

    if (!apiKey || !modelId || snapshot.status !== "connected") {
      return null;
    }

    try {
      const response = await fetch("/api/relay", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: snapshot.provider,
          model: modelId,
          messages: buildRelayMessages(serverId),
        }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json().catch(() => null);
      const content = typeof payload?.content === "string" ? payload.content.trim() : "";
      return content || null;
    } catch {
      return null;
    }
  };

  const getRelayTargets = (sender: ChatSender): Exclude<ServerId, "hum">[] => {
    if (sender === "human") return [...aiRelayOrder];

    if (sender === "ana" || sender === "bui" || sender === "arc") {
      return aiRelayOrder.filter((serverId) => serverId !== sender);
    }

    return [];
  };

  const sendChatMessage = (sender: ChatSender, text: string, relayWave = 0) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const entry: ChatMessage = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender,
      text: trimmed,
    };

    serverOrder.forEach((serverId) => {
      appendChatEntry(serverId, entry);
    });

    if (sender === "human") {
      patchServer("hum", { message: "" });
    } else {
      patchServer(sender, { draft: "" });
    }

    const nextSpeakers = relayWave < maxRelayWaves ? getRelayTargets(sender) : [];
    if (nextSpeakers.length) {
      const relaySource = sender === "human" ? "Human" : serverMeta[sender].title;
      const relayTargets = nextSpeakers.map((serverId) => serverMeta[serverId].title).join(", ");
      const relayEntry: ChatMessage = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sender: "system",
        text: `Wave ${relayWave + 1}: ${relaySource} hands off to ${relayTargets}`,
      };

      serverOrder.forEach((serverId) => {
        appendChatEntry(serverId, relayEntry);
      });

      nextSpeakers.forEach((nextSpeaker, index) => {
        window.setTimeout(
          () => {
            void requestRelayReply(nextSpeaker).then((replyText) => {
              sendChatMessage(
                nextSpeaker,
                replyText || buildAutoReply(nextSpeaker, trimmed),
                relayWave + 1,
              );
            });
          },
          (sender === "human" ? 450 : 550) + index * 180,
        );
      });
    }
  };

  return (
    <main
      className={`db8-app h-[100svh] overflow-hidden px-4 py-4 sm:px-6 sm:py-6 ${getThemeShellClass(theme)}`}
    >
      <div className="db8-shell grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] content-start items-start gap-2.5 lg:grid-cols-[64px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch">
        <div className="lg:self-stretch">
          <Tabs
            value={activeServer}
            onValueChange={(value) => {
              setActiveServer(value as ServerId);
              setActiveSection("conversation");
            }}
            className="grid gap-3 lg:flex lg:h-full lg:flex-col"
          >
            <div className="flex items-start gap-3 lg:flex-col">
              <TabsList variant="responsiveRail" className="min-w-0 flex-1 self-start">
                {serverOrder.map((serverId) => {
                  return (
                    <TabsTrigger
                      key={serverId}
                      value={serverId}
                      variant="responsiveRail"
                      className="!flex-none !min-w-0 h-14 w-14 flex-col justify-center gap-0.5 px-0 text-center lg:!w-14"
                    >
                      <span className="inline-flex size-7 items-center justify-center rounded-sm border border-current/20 text-[0.65rem]">
                        {getServerTitle(serverId).slice(0, 3).toUpperCase()}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="ml-auto flex items-start lg:mt-auto lg:ml-0 lg:justify-start lg:pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  onClick={() =>
                    setTheme((current) =>
                      current === "light" ? "dark" : current === "dark" ? "color" : "light",
                    )
                  }
                  aria-label={`Switch to ${nextThemeLabel} mode`}
                >
                  {theme === "dark" ? (
                    <SunIcon className="size-4" aria-hidden="true" />
                  ) : theme === "color" ? (
                    <MoonIcon className="size-4" aria-hidden="true" />
                  ) : (
                    <PaletteIcon className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </Tabs>
        </div>

        <Card className="flex h-full min-h-0 flex-col border-border/80 bg-card/92 backdrop-blur">
          <CardHeader className="flex-col items-start gap-0 px-4 py-1.5 sm:px-6 sm:py-2">
            <div className="flex w-full items-start justify-between gap-2">
              <div className="space-y-1">
                {editingTitleServer === activeServer ? (
                  <input
                    autoFocus
                    className="db8-field !w-auto min-w-[10ch] border-transparent bg-transparent px-0 py-0 text-lg font-semibold tracking-tight shadow-none focus:border-ring focus:shadow-none"
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    onBlur={commitTitle}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitTitle();
                      }

                      if (event.key === "Escape") {
                        event.preventDefault();
                        setTitleDraft(activeTitle);
                        setEditingTitleServer(null);
                      }
                    }}
                  />
                ) : (
                  <CardTitle
                    className="cursor-text text-lg tracking-tight"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setTitleDraft(activeTitle);
                      setEditingTitleServer(activeServer);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setTitleDraft(activeTitle);
                        setEditingTitleServer(activeServer);
                      }
                    }}
                    aria-label="Edit title"
                  >
                    {activeTitle}
                  </CardTitle>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-0 sm:px-6 sm:py-0">
            {activeSection === "conversation" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="min-h-[10rem] flex-1 overflow-y-auto rounded-md border border-border/70 bg-background/70 p-3">
                  <div className="space-y-2">
                    {activeState.chatLog.length ? (
                      activeState.chatLog.map((entry) => {
                        const senderLabel =
                          entry.sender === "human"
                            ? "Human"
                            : entry.sender === "system"
                              ? "Relay"
                              : serverMeta[entry.sender].title;

                        return (
                          <div
                            key={entry.id}
                            className={
                              entry.sender === "system"
                                ? "rounded-md border border-border/70 bg-muted/40 px-3 py-1.5 text-center"
                                : "rounded-md border border-border/70 bg-card/70 px-3 py-2"
                            }
                          >
                            {entry.sender === "system" ? (
                              <div className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                                {entry.text}
                              </div>
                            ) : (
                              <>
                                <div className="mb-1 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                                  {senderLabel}
                                </div>
                                <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                                  {entry.text}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm leading-6 text-muted-foreground">
                        Start the room by sending a message to all three AIs.
                      </p>
                    )}
                  </div>
                </div>

                {activeServer === "hum" ? (
                  <>
                    <label className="db8-field-group">
                      <span className="db8-field-label">Broadcast message</span>
                      <textarea
                        className="db8-field db8-textarea min-h-[8rem]"
                        value={activeState.message}
                        onChange={(event) =>
                          patchServer(activeServer, { message: event.target.value })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                            event.preventDefault();
                            sendChatMessage("human", activeState.message);
                          }
                        }}
                        placeholder="Write a message for all three AIs..."
                      />
                    </label>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="px-4"
                        onClick={() => sendChatMessage("human", activeState.message)}
                        disabled={!activeState.message.trim()}
                      >
                        Send to all AIs
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {activeSection === "connections" && activeServer !== "hum" ? (
              <div className="space-y-4">
                <div
                  className="db8-shine-border"
                  data-connected={activeState.status === "connected" ? "true" : "false"}
                >
                  <div className="db8-shine-border__inner grid gap-3 sm:grid-cols-2">
                    <label className="db8-field-group">
                      <span className="db8-field-label">Provider</span>
                      <select
                        className="db8-field db8-select"
                        value={activeState.provider}
                        onChange={(event) =>
                          setProvider(activeServer, event.target.value as ProviderKey)
                        }
                      >
                        {providerOrder.map((provider) => (
                          <option key={provider} value={provider}>
                            {providerLabels[provider]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="db8-field-group">
                      <span className="db8-field-label">Gateway key</span>
                      <input
                        className="db8-field db8-input"
                        type="password"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={activeState.key}
                        onChange={(event) =>
                          patchServer(activeServer, { key: event.target.value, status: "idle" })
                        }
                        onPaste={(event) => {
                          const pastedKey = event.clipboardData.getData("text").trim();
                          if (!pastedKey) return;

                          event.preventDefault();
                          patchServer(activeServer, { key: pastedKey, status: "idle" });
                          void connectProvider(activeServer, pastedKey);
                        }}
                        placeholder={`Add ${providerLabels[activeState.provider]} key`}
                      />
                    </label>
                  </div>
                </div>

                <label className="db8-field-group">
                  <span className="db8-field-label">Model</span>
                  <select
                    className="db8-field db8-select"
                    value={activeState.model}
                    onChange={(event) => {
                      void probeModel(activeServer, event.target.value);
                    }}
                    disabled={!activeModels.length}
                  >
                    {activeModels.length ? (
                      <>
                        <option value="">Select a model to test</option>
                        {activeModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.label}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="">
                        {activeState.status === "connected" || activeState.status === "partial"
                          ? "Loading models..."
                          : "Connect provider first"}
                      </option>
                    )}
                  </select>
                </label>

                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-left"
                        onClick={() => setIsConnectionDialogOpen(true)}
                        aria-label="Open connection dialog"
                      >
                        <PlugConnectedIcon className="size-3.5" aria-hidden="true" />
                        <span>Connection status</span>
                      </button>
                      <span
                        className={`font-semibold tracking-[0.18em] ${getConnectionStatusTone(activeState.status)}`}
                      >
                        {getConnectionStatusLabel(activeState.status)}
                      </span>
                    </div>
                    {activeServer !== "hum" ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {activeState.status === "connected"
                          ? "The provider is connected and the model list has been loaded."
                          : activeState.status === "scanning"
                            ? "The room is probing the provider for models."
                            : activeState.status === "error"
                              ? "The last probe failed. Check the key and try again."
                              : "Set a key and connect the provider to populate the models."}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>

          {activeServer !== "hum" ? (
            <CardFooter className="border-t border-border/70 px-4 py-3 text-sm text-muted-foreground sm:px-6 sm:pt-5 sm:pb-6">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left shadow-[2px_2px_0_1px_var(--button-wall)] transition-[transform,box-shadow] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_1px_var(--button-wall)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                onClick={() => setIsConnectionDialogOpen(true)}
                aria-label="Open connection dialog"
              >
                <span className="inline-flex items-center gap-2">
                  <PlugConnectedIcon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{providerLabels[activeState.provider]}</span>
                </span>
                <span className="font-medium">{activeState.model || "NO_MODEL"}</span>
              </button>
            </CardFooter>
          ) : null}
        </Card>
      </div>

      {isConnectionDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="connection-dialog-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsConnectionDialogOpen(false);
            }
          }}
          tabIndex={-1}
        >
          <Card
            className="w-full max-w-3xl border-border/80 bg-card/95 backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader className="flex-col items-start gap-3">
              <div className="flex w-full items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle id="connection-dialog-title" className="text-2xl tracking-tight">
                    Connection panel
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {activeMeta.title} · {providerLabels[activeState.provider]}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  onClick={() => setIsConnectionDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <ConnectionPanel
                state={activeState}
                activeModels={activeModels}
                onSetProvider={(provider) => setProvider(activeServer, provider)}
                onPatchState={(patch) => patchServer(activeServer, patch)}
                onConnect={() => void connectProvider(activeServer)}
                onProbeModel={(modelId) => void probeModel(activeServer, modelId)}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

export default App;
