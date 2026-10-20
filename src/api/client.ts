import type {
  AuditEntry,
  Binding,
  Channel,
  ChannelView,
  CommandsView,
  ConnectorStatus,
  CustomCommand,
  DispatchResult,
  IntegrationStatus,
  KnowledgeDoc,
  StickerFile,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

const TOKEN_KEY = "gandaraga_admin_token";

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const msg = body?.error ?? `request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

export const api = {
  base: BASE,

  // health / auth probe
  verify: () => request<ChannelView[]>("/api/channels"),

  // channels
  listChannels: () => request<ChannelView[]>("/api/channels"),
  getChannel: (id: string) => request<Channel>(`/api/channels/${id}`),
  createChannel: (name: string, description: string) =>
    request<Channel>("/api/channels", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  updateChannel: (id: string, name: string, description: string) =>
    request<Channel>(`/api/channels/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, description }),
    }),
  deleteChannel: (id: string) =>
    request<void>(`/api/channels/${id}`, { method: "DELETE" }),

  // docs
  listDocs: (channelId: string) =>
    request<KnowledgeDoc[]>(`/api/channels/${channelId}/docs`),
  uploadDoc: (channelId: string, filename: string, content: string) =>
    request<{ status: string }>(`/api/channels/${channelId}/docs`, {
      method: "POST",
      body: JSON.stringify({ filename, content }),
    }),
  getDoc: (docId: string) => request<KnowledgeDoc>(`/api/docs/${docId}`),
  updateDoc: (docId: string, content: string) =>
    request<void>(`/api/docs/${docId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),
  deleteDoc: (docId: string) =>
    request<void>(`/api/docs/${docId}`, { method: "DELETE" }),

  // bindings
  listBindings: (channelId: string) =>
    request<Binding[]>(`/api/channels/${channelId}/bindings`),
  addBinding: (channelId: string, connector: string, chatId: string, label: string) =>
    request<Binding>(`/api/channels/${channelId}/bindings`, {
      method: "POST",
      body: JSON.stringify({ connector, chat_id: chatId, label }),
    }),
  deleteBinding: (id: string) =>
    request<void>(`/api/bindings/${id}`, { method: "DELETE" }),

  // commands
  getCommands: (channelId: string) =>
    request<CommandsView>(`/api/channels/${channelId}/commands`),
  toggleCommand: (channelId: string, command: string, enabled: boolean) =>
    request<CommandsView>(`/api/channels/${channelId}/commands`, {
      method: "PATCH",
      body: JSON.stringify({ command, enabled }),
    }),
  setFallback: (channelId: string, fallback: string) =>
    request<CommandsView>(`/api/channels/${channelId}/commands`, {
      method: "PATCH",
      body: JSON.stringify({ fallback_message: fallback }),
    }),

  // custom commands
  listCustomCommands: (channelId: string) =>
    request<CustomCommand[]>(`/api/channels/${channelId}/custom-commands`),
  saveCustomCommand: (
    channelId: string,
    command: string,
    answer: string,
    stickerUrl: string,
    enabled: boolean
  ) =>
    request<CustomCommand>(`/api/channels/${channelId}/custom-commands`, {
      method: "POST",
      body: JSON.stringify({ command, answer, sticker_url: stickerUrl, enabled }),
    }),
  deleteCustomCommand: (id: string) =>
    request<void>(`/api/custom-commands/${id}`, { method: "DELETE" }),

  // stickers
  listStickers: () => request<StickerFile[]>("/api/stickers"),
  deleteSticker: (file: string) =>
    request<void>(`/api/stickers/${encodeURIComponent(file)}`, { method: "DELETE" }),
  pruneStickers: () =>
    request<{ deleted: string[]; kept: number }>("/api/stickers/prune", { method: "POST" }),

  // integrations (Jira/Confluence/Bitbucket/Bamboo health)
  listIntegrations: () => request<IntegrationStatus[]>("/api/integrations"),

  // connectors
  listConnectors: () => request<ConnectorStatus[]>("/api/connectors"),
  linkWhatsApp: () =>
    request<ConnectorStatus>("/api/connectors/whatsapp/link", { method: "POST" }),

  // audit
  listAudit: (limit = 100) => request<AuditEntry[]>(`/api/audit?limit=${limit}`),

  // test
  testQuery: (channelId: string, text: string) =>
    request<DispatchResult>("/api/test/query", {
      method: "POST",
      body: JSON.stringify({ channel_id: channelId, text }),
    }),
};
