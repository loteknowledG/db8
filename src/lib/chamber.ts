export type ServerId = "ana" | "bui" | "arc" | "hum";
export type AiServerId = Exclude<ServerId, "hum">;

export type SeatId = "north" | "east" | "west";
export type AgentStatus = "active" | "idle";
export type ChatSender = ServerId | "human" | "system";

export type Visibility =
  | { kind: "public" }
  | {
      kind: "dm";
      from: ServerId;
      to: ServerId;
    };

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  visibility: Visibility;
  createdAt: number;
};

export const serverOrder: ServerId[] = ["ana", "bui", "arc", "hum"];
export const aiRelayOrder: AiServerId[] = ["ana", "bui", "arc"];
export const seatOptions: SeatId[] = ["north", "east", "west"];

export function makeMessage(sender: ChatSender, text: string, visibility: Visibility): ChatMessage {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
    visibility,
    createdAt: Date.now(),
  };
}

export function relayTargets(sender: ChatSender): AiServerId[] {
  if (sender === "human") return [...aiRelayOrder];
  if (sender === "ana" || sender === "bui" || sender === "arc") {
    return aiRelayOrder.filter((agent) => agent !== sender);
  }
  return [];
}

export function isVisibleToViewer(message: ChatMessage, viewer: ServerId): boolean {
  if (message.visibility.kind === "public") return true;
  if (viewer === "hum") return true;
  return message.visibility.from === viewer || message.visibility.to === viewer;
}

export function dmTargetForViewer(message: ChatMessage, viewer: ServerId): ServerId | null {
  if (message.visibility.kind !== "dm") return null;
  if (message.visibility.to === viewer) return message.visibility.from;
  if (message.visibility.from === viewer) return message.visibility.to;
  return null;
}

export function visibilityLabel(message: ChatMessage): string {
  if (message.visibility.kind === "public") return "PUBLIC";
  return `DM ${message.visibility.from.toUpperCase()} -> ${message.visibility.to.toUpperCase()}`;
}

export function computeAgentStatus(messages: ChatMessage[], agent: AiServerId): AgentStatus {
  const latest = [...messages].reverse().find((entry) => entry.sender === agent);
  if (!latest) return "idle";
  return Date.now() - latest.createdAt < 120000 ? "active" : "idle";
}
