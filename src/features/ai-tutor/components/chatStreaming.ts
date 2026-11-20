import type { ChatMessage } from './AiChatWindow';

/** Drops the in-progress streamed answer so the next update (or the final answer) replaces it. */
export const withoutStreaming = (messages: ChatMessage[]) => (messages[messages.length - 1]?.streaming ? messages.slice(0, -1) : messages);
