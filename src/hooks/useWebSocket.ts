import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '../services/api';
import type { WebSocketEvent, Message, TypingIndicator, Conversation, ChatUser } from '../types/chat';

const WEBSOCKET_URL = 'http://localhost:3000';

interface UseWebSocketOptions {
  onMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  onMessageDelete?: (messageId: string, conversationId: string) => void;
  onConversationNew?: (conversation: Conversation) => void;
  onConversationUpdate?: (conversation: Conversation) => void;
  onTypingStart?: (data: TypingIndicator) => void;
  onTypingStop?: (data: TypingIndicator) => void;
  onUserOnline?: (user: ChatUser) => void;
  onUserOffline?: (user: ChatUser) => void;
  onReadReceipt?: (data: { conversationId: string; userId: string; messageId: string }) => void;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onMessage,
    onMessageUpdate,
    onMessageDelete,
    onConversationNew,
    onConversationUpdate,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
    onReadReceipt,
    enabled = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Store callbacks in refs to avoid reconnecting when callbacks change
  const callbacksRef = useRef({
    onMessage,
    onMessageUpdate,
    onMessageDelete,
    onConversationNew,
    onConversationUpdate,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
    onReadReceipt,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onMessageUpdate,
      onMessageDelete,
      onConversationNew,
      onConversationUpdate,
      onTypingStart,
      onTypingStop,
      onUserOnline,
      onUserOffline,
      onReadReceipt,
    };
  }, [
    onMessage,
    onMessageUpdate,
    onMessageDelete,
    onConversationNew,
    onConversationUpdate,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
    onReadReceipt,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const token = tokenStorage.getAccessToken();
    if (!token) {
      return;
    }

    const socket = io(WEBSOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('reconnect_attempt', () => {
      setIsReconnecting(true);
    });

    socket.on('reconnect_failed', () => {
      setIsReconnecting(false);
    });

    // Message events
    socket.on('message:new', (event: WebSocketEvent<Message>) => {
      callbacksRef.current.onMessage?.(event.payload);
    });

    socket.on('message:update', (event: WebSocketEvent<Message>) => {
      callbacksRef.current.onMessageUpdate?.(event.payload);
    });

    socket.on('message:delete', (event: WebSocketEvent<{ messageId: string; conversationId: string }>) => {
      callbacksRef.current.onMessageDelete?.(event.payload.messageId, event.payload.conversationId);
    });

    // Conversation events
    socket.on('conversation:new', (event: WebSocketEvent<Conversation>) => {
      callbacksRef.current.onConversationNew?.(event.payload);
    });

    socket.on('conversation:update', (event: WebSocketEvent<Conversation>) => {
      callbacksRef.current.onConversationUpdate?.(event.payload);
    });

    // Typing events
    socket.on('typing:start', (event: WebSocketEvent<TypingIndicator>) => {
      callbacksRef.current.onTypingStart?.(event.payload);
    });

    socket.on('typing:stop', (event: WebSocketEvent<TypingIndicator>) => {
      callbacksRef.current.onTypingStop?.(event.payload);
    });

    // Presence events
    socket.on('user:online', (event: WebSocketEvent<ChatUser>) => {
      callbacksRef.current.onUserOnline?.(event.payload);
    });

    socket.on('user:offline', (event: WebSocketEvent<ChatUser>) => {
      callbacksRef.current.onUserOffline?.(event.payload);
    });

    // Read receipt events
    socket.on('read:receipt', (event: WebSocketEvent<{ conversationId: string; userId: string; messageId: string }>) => {
      callbacksRef.current.onReadReceipt?.(event.payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  const sendTypingStart = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', { conversationId });
  }, []);

  const sendTypingStop = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:stop', { conversationId });
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:join', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:leave', { conversationId });
  }, []);

  return {
    isConnected,
    isReconnecting,
    sendTypingStart,
    sendTypingStop,
    joinConversation,
    leaveConversation,
  };
}
