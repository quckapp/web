export type UserStatus = 'online' | 'offline' | 'away';

export interface ChatUser {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: UserStatus;
  lastSeenAt?: Date;
}

export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: ChatUser;
  content: string;
  type: MessageType;
  createdAt: Date;
  updatedAt?: Date;
  readBy: string[];
  replyToId?: string;
  replyTo?: Message;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatar?: string;
  participants: ChatUser[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReadReceipt {
  conversationId: string;
  userId: string;
  messageId: string;
  readAt: Date;
}

// WebSocket event types
export type WebSocketEventType =
  | 'message:new'
  | 'message:update'
  | 'message:delete'
  | 'conversation:new'
  | 'conversation:update'
  | 'typing:start'
  | 'typing:stop'
  | 'user:online'
  | 'user:offline'
  | 'read:receipt';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: Date;
}

// API request/response types
export interface CreateConversationRequest {
  participantIds: string[];
  name?: string;
  type?: ConversationType;
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  replyToId?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}
