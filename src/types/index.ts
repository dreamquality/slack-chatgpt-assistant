export interface SlackAppMentionEvent {
  type: "app_mention";
  user: string;
  text: string;
  channel: string;
  ts: string;
  event_ts: string;
  thread_ts?: string;
}

export interface SlackMessageEvent {
  type: "message";
  user: string;
  text: string;
  channel: string;
  ts: string;
  event_ts: string;
  thread_ts?: string;
  subtype?: string;
}
