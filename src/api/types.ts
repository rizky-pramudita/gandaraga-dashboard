export interface Channel {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface ChannelView extends Channel {
  doc_count: number;
  binding_count: number;
}

export interface KnowledgeDoc {
  id: string;
  channel_id: string;
  filename: string;
  content?: string;
  version: number;
  attached_at: string;
}

export interface Binding {
  id: string;
  channel_id: string;
  connector: string;
  chat_id: string;
  label: string;
  created_at: string;
}

export interface CommandConfig {
  id: string;
  channel_id: string;
  command: string;
  enabled: boolean;
}

export interface CommandsView {
  commands: CommandConfig[];
  fallback_message: string;
}

export interface CustomCommand {
  id: string;
  channel_id: string;
  command: string;
  answer: string;
  sticker_url?: string;
  enabled: boolean;
  created_at: string;
}

export interface StickerFile {
  file: string;
  size: number;
  url: string;
}

export interface ConnectorStatus {
  name: string;
  connected: boolean;
  needs_qr: boolean;
  qr_code?: string;
  detail?: string;
}

export interface IntegrationStatus {
  name: string;
  base_url: string;
  enabled: boolean;
  status: "ok" | "unauthorized" | "unreachable" | "error" | "disabled";
  detail?: string;
}

export interface AuditEntry {
  id: string;
  connector: string;
  chat_id: string;
  sender_id: string;
  command: string;
  text: string;
  response: string;
  ts: string;
}

export interface DispatchResult {
  channel?: Channel;
  command: string;
  response: string;
  matched: boolean;
}
