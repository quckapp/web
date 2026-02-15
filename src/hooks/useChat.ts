import { useState, useCallback, useEffect, useRef } from 'react';
import chatService from '../services/chatService';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '../contexts/AuthContext';
import type {
  Conversation,
  Message,
  ChatUser,
  TypingIndicator,
  SendMessageRequest,
  CreateConversationRequest,
} from '../types/chat';

interface UseChatReturn {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  typingUsers: Map<string, ChatUser[]>;
  isLoading: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  error: string | null;
  isConnected: boolean;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  createConversation: (participantIds: string[], name?: string) => Promise<Conversation>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: () => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  searchUsers: (query: string) => Promise<ChatUser[]>;
  refreshConversations: () => Promise<void>;
}

export function useChat(): UseChatReturn {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, ChatUser[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentConversationRef = useRef<string | null>(null);

  // Handle incoming messages
  const handleNewMessage = useCallback((message: Message) => {
    // Update messages if it's for the current conversation
    if (message.conversationId === currentConversationRef.current) {
      setMessages((prev) => {
        // Check for optimistic update
        const existingIndex = prev.findIndex(
          (m) => m.id === message.id || (m.id.startsWith('temp-') && m.content === message.content)
        );
        if (existingIndex !== -1) {
          // Replace optimistic message with real one
          const updated = [...prev];
          updated[existingIndex] = message;
          return updated;
        }
        return [...prev, message];
      });
    }

    // Update conversation's last message
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === message.conversationId
          ? {
              ...conv,
              lastMessage: message,
              updatedAt: new Date(),
              unreadCount:
                message.conversationId === currentConversationRef.current
                  ? 0
                  : conv.unreadCount + 1,
            }
          : conv
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  }, []);

  // Handle message updates
  const handleMessageUpdate = useCallback((message: Message) => {
    if (message.conversationId === currentConversationRef.current) {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
    }
  }, []);

  // Handle message deletion
  const handleMessageDelete = useCallback((messageId: string, conversationId: string) => {
    if (conversationId === currentConversationRef.current) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  }, []);

  // Handle new conversations
  const handleNewConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      if (prev.find((c) => c.id === conversation.id)) {
        return prev;
      }
      return [conversation, ...prev];
    });
  }, []);

  // Handle conversation updates
  const handleConversationUpdate = useCallback((conversation: Conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c))
    );
    if (currentConversationRef.current === conversation.id) {
      setCurrentConversation(conversation);
    }
  }, []);

  // Handle typing indicators
  const handleTypingStart = useCallback((data: TypingIndicator) => {
    if (data.userId === currentUser?.id) return;

    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(data.conversationId) || [];
      if (!existing.find((u) => u.id === data.userId)) {
        // We'd need to fetch user info, but for now just use ID
        newMap.set(data.conversationId, [
          ...existing,
          { id: data.userId, email: '', status: 'online' },
        ]);
      }
      return newMap;
    });
  }, [currentUser?.id]);

  const handleTypingStop = useCallback((data: TypingIndicator) => {
    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(data.conversationId) || [];
      newMap.set(
        data.conversationId,
        existing.filter((u) => u.id !== data.userId)
      );
      return newMap;
    });
  }, []);

  // WebSocket connection
  const { isConnected, sendTypingStart, sendTypingStop, joinConversation, leaveConversation } =
    useWebSocket({
      onMessage: handleNewMessage,
      onMessageUpdate: handleMessageUpdate,
      onMessageDelete: handleMessageDelete,
      onConversationNew: handleNewConversation,
      onConversationUpdate: handleConversationUpdate,
      onTypingStart: handleTypingStart,
      onTypingStop: handleTypingStop,
      enabled: !!currentUser,
    });

  // Load conversations on mount
  useEffect(() => {
    if (!currentUser) return;

    const loadConversations = async () => {
      try {
        setIsLoading(true);
        const response = await chatService.getConversations();
        setConversations(response.conversations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [currentUser]);

  // Select a conversation
  const selectConversation = useCallback(
    async (conversationId: string) => {
      try {
        // Leave previous conversation room
        if (currentConversationRef.current) {
          leaveConversation(currentConversationRef.current);
        }

        currentConversationRef.current = conversationId;
        setIsLoadingMessages(true);
        setMessages([]);

        // Find conversation in list or fetch it
        let conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) {
          conversation = await chatService.getConversation(conversationId);
        }
        setCurrentConversation(conversation);

        // Join conversation room for real-time updates
        joinConversation(conversationId);

        // Load messages
        const response = await chatService.getMessages(conversationId);
        setMessages(response.messages.reverse()); // Oldest first
        setHasMoreMessages(response.hasMore);

        // Mark as read
        await chatService.markAsRead(conversationId);

        // Update unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [conversations, joinConversation, leaveConversation]
  );

  // Send a message
  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!currentConversationRef.current || !content.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        conversationId: currentConversationRef.current,
        senderId: currentUser?.id || '',
        content: content.trim(),
        type: 'text',
        createdAt: new Date(),
        readBy: [],
        replyToId,
      };

      // Optimistic update
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const request: SendMessageRequest = {
          content: content.trim(),
          type: 'text',
          replyToId,
        };
        await chatService.sendMessage(currentConversationRef.current, request);
      } catch (err) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    },
    [currentUser?.id]
  );

  // Create a new conversation
  const createConversation = useCallback(
    async (participantIds: string[], name?: string): Promise<Conversation> => {
      const request: CreateConversationRequest = {
        participantIds,
        name,
        type: participantIds.length > 1 ? 'group' : 'direct',
      };
      const conversation = await chatService.createConversation(request);
      setConversations((prev) => [conversation, ...prev]);
      return conversation;
    },
    []
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversationRef.current || !hasMoreMessages || isLoadingMessages) return;

    try {
      setIsLoadingMessages(true);
      const oldestMessage = messages[0];
      const response = await chatService.getMessages(
        currentConversationRef.current,
        1,
        50,
        oldestMessage?.id
      );
      setMessages((prev) => [...response.messages.reverse(), ...prev]);
      setHasMoreMessages(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [hasMoreMessages, isLoadingMessages, messages]);

  // Mark current conversation as read
  const markAsRead = useCallback(async () => {
    if (!currentConversationRef.current) return;

    try {
      await chatService.markAsRead(currentConversationRef.current);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversationRef.current ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch {
      // Ignore errors for marking as read
    }
  }, []);

  // Send typing indicator
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!currentConversationRef.current) return;

      if (isTyping) {
        sendTypingStart(currentConversationRef.current);

        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          if (currentConversationRef.current) {
            sendTypingStop(currentConversationRef.current);
          }
        }, 3000);
      } else {
        sendTypingStop(currentConversationRef.current);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    },
    [sendTypingStart, sendTypingStop]
  );

  // Search users
  const searchUsers = useCallback(async (query: string): Promise<ChatUser[]> => {
    if (!query.trim()) return [];
    return chatService.searchUsers(query);
  }, []);

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    try {
      const response = await chatService.getConversations();
      setConversations(response.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh conversations');
    }
  }, []);

  return {
    conversations,
    currentConversation,
    messages,
    typingUsers,
    isLoading,
    isLoadingMessages,
    hasMoreMessages,
    error,
    isConnected,
    selectConversation,
    sendMessage,
    createConversation,
    loadMoreMessages,
    markAsRead,
    setTyping,
    searchUsers,
    refreshConversations,
  };
}
