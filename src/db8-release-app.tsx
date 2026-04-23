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
import {
  aiRelayOrder,
  computeAgentStatus,
  dmTargetForViewer,
  isVisibleToViewer,
  makeMessage,
  relayTargets,
  seatOptions,
  serverOrder,
  type AiServerId,
  type ChatMessage,
  type ChatSender,
  type SeatId,
  type ServerId,
  visibilityLabel,
} from "./lib/chamber";
import {
  connectionTone,
  normalizeModels,
  providerLabels,
  providerOrder,
  type ConnectionStatus,
  type ModelOption,
  type ProviderKey,
} from "./lib/connection";

type ThemeMode = "light" | "dark" | "color";
type TuiSignalMode = "off" | "on";
type SectionId = "agent_console" | "group_view" | "supervision" | "connections";
type EntryMode = "create" | "join" | null;
type ComposerMode = "public" | "dm";

type ServerState = {
  provider: ProviderKey;
  key: string;
  model: string;
  models: ModelOption[];
  status: ConnectionStatus;
  draft: string;
  modelHealth: Record<string, "idle" | "testing" | "green" | "grey">;
};

type ServerMeta = {
  title: string;
  summary: string;
};

const serverMeta: Record<ServerId, ServerMeta> = {
  ana: { title: "Nova", summary: "Signal compression" },
  bui: { title: "Forge", summary: "Structure and repair" },
  arc: { title: "Vault", summary: "Memory retention" },
  hum: { title: "Human", summary: "Supervision and steering" },
};

const serverSeed: Record<ServerId, ServerState> = {
  ana: {
    provider: "opencode",
    key: "",
    model: "",
    models: [],
    status: "idle",
    draft: "",
    modelHealth: {},
  },
  bui: {
    provider: "openrouter",
    key: "",
    model: "",
    models: [],
    status: "idle",
    draft: "",
    modelHealth: {},
  },
  arc: {
    provider: "openai",
    key: "",
    model: "",
    models: [],
    status: "idle",
    draft: "",
    modelHealth: {},
  },
  hum: {
    provider: "openai",
    key: "",
    model: "manual",
    models: [],
    status: "connected",
    draft: "",
    modelHealth: {},
  },
};

function getThemeShellClass(theme: ThemeMode) {
  if (theme === "dark") {
    return "bg-[radial-gradient(circle_at_top,_rgba(63,63,70,0.38),_transparent_34%),linear-gradient(180deg,_#09090b_0%,_#111114_44%,_#0c0c0d_100%)] text-foreground";
  }
  if (theme === "color") {
    return "bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.24),_transparent_44%),linear-gradient(180deg,_#0f172a_0%,_#111827_48%,_#020617_100%)] text-foreground";
  }
  return "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.82),_transparent_30%),linear-gradient(180deg,_#f8f7f4_0%,_#eee8dd_44%,_#e4dccf_100%)] text-foreground";
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
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
    </svg>
  );
}

type ConnectionPanelProps = {
  state: ServerState;
  onPatch: (patch: Partial<ServerState>) => void;
  onProvider: (provider: ProviderKey) => void;
  onConnect: () => void;
  onProbe: (modelId: string) => void;
};

function ConnectionPanel({ state, onPatch, onProvider, onConnect, onProbe }: ConnectionPanelProps) {
  return (
    <div className="space-y-4">
      <div
        className="db8-shine-border"
        data-connected={state.status === "connected" ? "true" : "false"}
      >
        <div className="db8-shine-border__inner grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="db8-field-group">
            <span className="db8-field-label">Provider</span>
            <select
              className="db8-field db8-select"
              value={state.provider}
              onChange={(event) => onProvider(event.target.value as ProviderKey)}
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
              value={state.key}
              onChange={(event) => onPatch({ key: event.target.value, status: "idle" })}
              placeholder={`Add ${providerLabels[state.provider]} key`}
            />
          </label>
          <div className="db8-field-group sm:self-end">
            <span className="db8-field-label sm:opacity-0">Connect</span>
            <Button
              type="button"
              variant="outline"
              className="inline-flex h-11 w-11 items-center justify-center px-0"
              onClick={onConnect}
            >
              Go
            </Button>
          </div>
        </div>
      </div>
      <label className="db8-field-group">
        <span className="db8-field-label">Model</span>
        <select
          className="db8-field db8-select"
          value={state.model}
          onChange={(event) => onProbe(event.target.value)}
          disabled={!state.models.length}
        >
          {state.models.length ? (
            <>
              <option value="">Select model</option>
              {state.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </>
          ) : (
            <option value="">Connect first</option>
          )}
        </select>
      </label>
      <p className={`text-xs uppercase tracking-[0.2em] ${connectionTone(state.status)}`}>
        Connection: {state.status}
      </p>
    </div>
  );
}

function Db8ReleaseApp() {
  const [theme, setTheme] = React.useState<ThemeMode>("dark");
  const [tuiSignalMode, setTuiSignalMode] = React.useState<TuiSignalMode>("on");
  const [activeServer, setActiveServer] = React.useState<ServerId>("hum");
  const [activeSection, setActiveSection] = React.useState<SectionId>("agent_console");
  const [entryMode, setEntryMode] = React.useState<EntryMode>(null);
  const [chamberIdInput, setChamberIdInput] = React.useState("");
  const [chamberId, setChamberId] = React.useState("");
  const [chamberStarted, setChamberStarted] = React.useState(false);
  const [chamberError, setChamberError] = React.useState("");
  const [serverState, setServerState] = React.useState<Record<ServerId, ServerState>>(serverSeed);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [composerMode, setComposerMode] = React.useState<ComposerMode>("public");
  const [dmTarget, setDmTarget] = React.useState<ServerId>("ana");
  const [seatAssignments, setSeatAssignments] = React.useState<Partial<Record<AiServerId, SeatId>>>(
    {},
  );
  const [unreadDm, setUnreadDm] = React.useState<Record<ServerId, number>>({
    ana: 0,
    bui: 0,
    arc: 0,
    hum: 0,
  });

  React.useEffect(() => {
    document.documentElement.classList.remove("dark", "color");
    if (theme === "dark") document.documentElement.classList.add("dark");
    if (theme === "color") document.documentElement.classList.add("color");
  }, [theme]);

  React.useEffect(() => {
    setUnreadDm((current) => ({ ...current, [activeServer]: 0 }));
  }, [activeServer]);

  const patchServer = (serverId: ServerId, patch: Partial<ServerState>) => {
    setServerState((current) => ({ ...current, [serverId]: { ...current[serverId], ...patch } }));
  };

  const setProvider = (serverId: ServerId, provider: ProviderKey) => {
    patchServer(serverId, { provider, status: "idle", models: [], model: "", modelHealth: {} });
  };

  const connectProvider = async (serverId: ServerId) => {
    const snapshot = serverState[serverId];
    const apiKey = snapshot.key.trim();
    if (!apiKey) {
      patchServer(serverId, { status: "error" });
      setChamberError(`${serverMeta[serverId].title}: missing API key`);
      return;
    }
    patchServer(serverId, { status: "connecting" });
    try {
      const response = await fetch(`/api/models?provider=${snapshot.provider}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) throw new Error(`models endpoint ${response.status}`);
      const payload = await response.json().catch(() => null);
      const models = normalizeModels(snapshot.provider, payload);
      if (!models.length) throw new Error("no models returned");
      patchServer(serverId, { models, status: "connected" });
    } catch {
      patchServer(serverId, { status: "error" });
      setChamberError(`${serverMeta[serverId].title}: failed to connect provider`);
    }
  };

  const probeModel = async (serverId: ServerId, modelId: string) => {
    const snapshot = serverState[serverId];
    if (!snapshot.key.trim() || !modelId.trim()) {
      patchServer(serverId, { status: "error" });
      setChamberError(`${serverMeta[serverId].title}: select a model before probe`);
      return;
    }
    patchServer(serverId, { status: "connecting", model: modelId });
    try {
      const response = await fetch("/api/probe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${snapshot.key.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider: snapshot.provider, model: modelId }),
      });
      if (!response.ok) throw new Error(`probe ${response.status}`);
      patchServer(serverId, { status: "connected" });
    } catch {
      patchServer(serverId, { status: "error" });
      setChamberError(`${serverMeta[serverId].title}: model probe failed`);
    }
  };

  const requestRelayReply = async (agent: AiServerId, prompt: string): Promise<string | null> => {
    const snapshot = serverState[agent];
    if (!snapshot.key.trim() || !snapshot.model.trim() || snapshot.status !== "connected")
      return null;
    try {
      const response = await fetch("/api/relay", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${snapshot.key.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: snapshot.provider,
          model: snapshot.model,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) return null;
      const payload = await response.json().catch(() => null);
      return typeof payload?.content === "string" ? payload.content.trim() : null;
    } catch {
      return null;
    }
  };

  const appendMessage = (entry: ChatMessage) => {
    setMessages((current) => [...current, entry]);
    if (entry.visibility.kind === "dm" && entry.visibility.to !== activeServer) {
      setUnreadDm((current) => ({
        ...current,
        [entry.visibility.to]: current[entry.visibility.to] + 1,
      }));
    }
  };

  const sendMessage = (sender: ServerId) => {
    if (!chamberStarted) {
      setChamberError("Start the chamber before sending messages.");
      return;
    }
    const draft = serverState[sender].draft.trim();
    if (!draft) return;
    const visibility =
      composerMode === "public"
        ? ({ kind: "public" } as const)
        : ({ kind: "dm", from: sender, to: dmTarget } as const);
    appendMessage(makeMessage(sender === "hum" ? "human" : sender, draft, visibility));
    patchServer(sender, { draft: "" });

    if (
      visibility.kind === "public" &&
      (sender === "hum" || sender === "ana" || sender === "bui" || sender === "arc")
    ) {
      relayTargets(sender === "hum" ? "human" : sender).forEach((target, index) => {
        window.setTimeout(
          () => {
            void requestRelayReply(target, draft).then((reply) => {
              if (reply) {
                appendMessage(makeMessage(target, reply, { kind: "public" }));
                return;
              }
              const fallback = `${serverMeta[target].title}: received and responding on the next chamber turn.`;
              appendMessage(makeMessage(target, fallback, { kind: "public" }));
            });
          },
          400 + index * 180,
        );
      });
    }
  };

  const readyToStart =
    aiRelayOrder.every((agent) => serverState[agent].status === "connected") &&
    aiRelayOrder.every((agent) => seatAssignments[agent]) &&
    new Set(aiRelayOrder.map((agent) => seatAssignments[agent])).size === aiRelayOrder.length;

  const visibleMessages = messages.filter((message) => isVisibleToViewer(message, activeServer));
  const publicMessages = messages.filter((message) => message.visibility.kind === "public");
  const supervisionMessages = messages;

  const startEntry = (mode: EntryMode) => {
    if (!mode) return;
    setEntryMode(mode);
    setChamberId(chamberIdInput.trim() || `db8-${Date.now().toString(36)}`);
    setChamberStarted(false);
    setChamberError("");
  };

  const toSeatValue = (value: string): SeatId | undefined => {
    if (!value) return undefined;
    return seatOptions.includes(value as SeatId) ? (value as SeatId) : undefined;
  };

  if (!entryMode) {
    return (
      <main className={`db8-app h-[100svh] px-4 py-6 sm:px-6 ${getThemeShellClass(theme)}`}>
        <Card className="mx-auto mt-12 w-full max-w-3xl border-border/80 bg-card/92 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">db8 chamber</CardTitle>
            <p className="text-sm text-muted-foreground">
              Multi-agent debate and reasoning chamber. Each agent gets a console, public and DM
              channels run in one room, and the human supervises all traffic.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="db8-field-group">
              <span className="db8-field-label">Create or join chamber</span>
              <input
                className="db8-field db8-input"
                value={chamberIdInput}
                onChange={(event) => setChamberIdInput(event.target.value)}
                placeholder="Optional chamber id"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => startEntry("create")}>
                Create chamber
              </Button>
              <Button variant="outline" onClick={() => startEntry("join")}>
                Join chamber
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Hints: a seat is an agent slot in the chamber. DM is direct agent-to-agent traffic
              visible to human supervision.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main
      className={`db8-app h-[100svh] overflow-hidden px-4 py-4 sm:px-6 sm:py-6 ${getThemeShellClass(theme)}`}
    >
      <div className="db8-shell grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] content-start items-start gap-2.5 lg:grid-cols-[64px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch">
        <div className="lg:self-stretch">
          <Tabs
            value={activeServer}
            onValueChange={(value) => setActiveServer(value as ServerId)}
            className="grid gap-3 lg:flex lg:h-full lg:flex-col"
          >
            <div className="flex items-start gap-3 lg:flex-col">
              <TabsList variant="responsiveRail" className="min-w-0 flex-1 self-start">
                {serverOrder.map((serverId) => (
                  <TabsTrigger
                    key={serverId}
                    value={serverId}
                    variant="responsiveRail"
                    className="!flex-none !min-w-0 h-14 w-14 flex-col justify-center gap-0.5 px-0 text-center lg:!w-14"
                  >
                    <span className="inline-flex size-7 items-center justify-center rounded-sm border border-current/20 text-[0.65rem]">
                      {serverMeta[serverId].title.slice(0, 3).toUpperCase()}
                    </span>
                    {unreadDm[serverId] > 0 ? (
                      <span className="text-[0.6rem] leading-none text-amber-500">
                        DM {unreadDm[serverId]}
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto px-3 lg:mt-auto lg:ml-0"
                onClick={() =>
                  setTheme((current) =>
                    current === "light" ? "dark" : current === "dark" ? "color" : "light",
                  )
                }
              >
                {theme === "dark" ? (
                  <SunIcon className="size-4" />
                ) : theme === "color" ? (
                  <MoonIcon className="size-4" />
                ) : (
                  <PaletteIcon className="size-4" />
                )}
              </Button>
            </div>
          </Tabs>
        </div>

        <Card className="flex h-full min-h-0 flex-col border-border/80 bg-card/92 backdrop-blur">
          <CardHeader className="flex-col items-start gap-2 px-4 py-2 sm:px-6">
            <CardTitle className="text-lg tracking-tight">
              {serverMeta[activeServer].title} · {serverMeta[activeServer].summary}
            </CardTitle>
            <div className="flex w-full flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Chamber: {chamberId}</span>
              <span>Mode: {entryMode}</span>
              <span>State: {chamberStarted ? "running" : "setup"}</span>
              {aiRelayOrder.map((agent) => (
                <span
                  key={agent}
                  className={
                    computeAgentStatus(messages, agent) === "active" ? "text-green-500" : ""
                  }
                >
                  {serverMeta[agent].title}:{computeAgentStatus(messages, agent)}
                </span>
              ))}
            </div>
            {!chamberStarted ? (
              <div className="flex w-full flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setChamberStarted(true)}
                  disabled={!readyToStart}
                >
                  Start chamber
                </Button>
                <span className="text-xs text-muted-foreground">
                  Assign seats and connect all AI consoles first.
                </span>
              </div>
            ) : null}
            {chamberError ? <p className="text-xs text-rose-500">{chamberError}</p> : null}
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-0 sm:px-6">
            <div className="mb-2 flex flex-wrap gap-2">
              {(["agent_console", "group_view", "supervision", "connections"] as SectionId[]).map(
                (section) => (
                  <Button
                    key={section}
                    variant={activeSection === section ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveSection(section)}
                  >
                    {section.replace("_", " ")}
                  </Button>
                ),
              )}
              <Button
                variant={tuiSignalMode === "on" ? "default" : "outline"}
                size="sm"
                onClick={() => setTuiSignalMode((current) => (current === "on" ? "off" : "on"))}
              >
                signal {tuiSignalMode}
              </Button>
            </div>

            {activeSection === "connections" ? (
              <div className="space-y-4 overflow-y-auto pb-4">
                {activeServer === "hum" ? (
                  <p className="text-sm text-muted-foreground">
                    Select an AI seat to configure provider connection.
                  </p>
                ) : (
                  <ConnectionPanel
                    state={serverState[activeServer]}
                    onPatch={(patch) => patchServer(activeServer, patch)}
                    onProvider={(provider) => setProvider(activeServer, provider)}
                    onConnect={() => void connectProvider(activeServer)}
                    onProbe={(modelId) => void probeModel(activeServer, modelId)}
                  />
                )}
              </div>
            ) : null}

            {activeSection === "supervision" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                <div className="grid gap-2 sm:grid-cols-3">
                  {aiRelayOrder.map((agent) => (
                    <label key={agent} className="db8-field-group">
                      <span className="db8-field-label">{serverMeta[agent].title} seat</span>
                      <select
                        className="db8-field db8-select"
                        value={seatAssignments[agent] ?? ""}
                        onChange={(event) =>
                          setSeatAssignments((current) => ({
                            ...current,
                            [agent]: toSeatValue(event.target.value),
                          }))
                        }
                      >
                        <option value="">Select seat</option>
                        {seatOptions.map((seat) => (
                          <option key={seat} value={seat}>
                            {seat.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div
                  className="db8-signal-pane min-h-[10rem] flex-1 overflow-y-auto rounded-md border border-border/70 bg-background/70 p-3"
                  data-tui-signal={tuiSignalMode}
                >
                  {supervisionMessages.length ? (
                    <div className="space-y-2">
                      {supervisionMessages.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-md border border-border/70 bg-card/70 px-3 py-2"
                        >
                          <div className="mb-1 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                            {entry.sender === "human" ? "HUMAN" : entry.sender.toUpperCase()} ·{" "}
                            {visibilityLabel(entry)}
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-6">{entry.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No chamber traffic yet. Human supervision view will show all public and DM
                      messages.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {activeSection === "group_view" ? (
              <div
                className="db8-signal-pane min-h-0 flex-1 overflow-y-auto rounded-md border border-border/70 bg-background/70 p-3"
                data-tui-signal={tuiSignalMode}
              >
                {publicMessages.length ? (
                  <div className="space-y-2">
                    {publicMessages.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md border border-border/70 bg-card/70 px-3 py-2"
                      >
                        <div className="mb-1 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                          {entry.sender === "human" ? "HUMAN" : entry.sender.toUpperCase()}
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-6">{entry.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Empty chamber state. Start the chamber and send a public message to begin.
                  </p>
                )}
              </div>
            ) : null}

            {activeSection === "agent_console" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                <div
                  className="db8-signal-pane min-h-[10rem] flex-1 overflow-y-auto rounded-md border border-border/70 bg-background/70 p-3"
                  data-tui-signal={tuiSignalMode}
                >
                  {visibleMessages.length ? (
                    <div className="space-y-2">
                      {visibleMessages.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-md border border-border/70 bg-card/70 px-3 py-2"
                        >
                          <div className="mb-1 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                            {entry.sender === "human" ? "HUMAN" : entry.sender.toUpperCase()}
                            {entry.visibility.kind === "dm"
                              ? ` · DM with ${dmTargetForViewer(entry, activeServer)?.toUpperCase() ?? "UNKNOWN"}`
                              : " · PUBLIC"}
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-6">{entry.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Empty chamber state for this console. Send public or DM traffic to start.
                    </p>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <textarea
                    className="db8-field db8-textarea min-h-[7rem]"
                    value={serverState[activeServer].draft}
                    onChange={(event) => patchServer(activeServer, { draft: event.target.value })}
                    placeholder={
                      activeServer === "hum"
                        ? "Human supervision message..."
                        : `Message as ${serverMeta[activeServer].title}...`
                    }
                  />
                  <label className="db8-field-group">
                    <span className="db8-field-label">Mode</span>
                    <select
                      className="db8-field db8-select"
                      value={composerMode}
                      onChange={(event) => setComposerMode(event.target.value as ComposerMode)}
                    >
                      <option value="public">Public</option>
                      <option value="dm">DM</option>
                    </select>
                  </label>
                  <label className="db8-field-group">
                    <span className="db8-field-label">DM target</span>
                    <select
                      className="db8-field db8-select"
                      value={dmTarget}
                      onChange={(event) => setDmTarget(event.target.value as ServerId)}
                      disabled={composerMode !== "dm"}
                    >
                      {serverOrder
                        .filter((id) => id !== activeServer)
                        .map((id) => (
                          <option key={id} value={id}>
                            {serverMeta[id].title}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Hint: seat = chamber position. DM = direct channel. Human sees all public and DM
                    traffic.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => sendMessage(activeServer)}
                    disabled={!serverState[activeServer].draft.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="border-t border-border/70 px-4 py-3 text-xs text-muted-foreground sm:px-6">
            Keep aimorphism shell stable. Movement cues come from existing visual language only.
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

export default Db8ReleaseApp;
