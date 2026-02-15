import { gatewayApi, parseApiError } from './api';
import type {
  Conversation,
  Message,
  ConversationsResponse,
  MessagesResponse,
  CreateConversationRequest,
  SendMessageRequest,
  ChatUser,
} from '../types/chat';

const chatService = {
  /**
   * Get all conversations for the current user
   */
  async getConversations(
    page: number = 1,
    limit: number = 20
  ): Promise<ConversationsResponse> {
    try {
      const response = await gatewayApi.get<ConversationsResponse>('/api/v1/conversations', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Get a specific conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await gatewayApi.get<Conversation>(
        `/api/v1/conversations/${conversationId}`
      );
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    try {
      const response = await gatewayApi.post<Conversation>('/api/v1/conversations', data);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
    before?: string
  ): Promise<MessagesResponse> {
    try {
      const response = await gatewayApi.get<MessagesResponse>(
        `/api/v1/conversations/${conversationId}/messages`,
        {
          params: { page, limit, before },
        }
      );
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    conversationId: string,
    data: SendMessageRequest
  ): Promise<Message> {
    try {
      const response = await gatewayApi.post<Message>(
        `/api/v1/conversations/${conversationId}/messages`,
        data
      );
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Mark messages as read in a conversation
   */
  async markAsRead(conversationId: string, messageId?: string): Promise<void> {
    try {
      await gatewayApi.post(`/api/v1/conversations/${conversationId}/read`, {
        messageId,
      });
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Delete a message
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    try {
      await gatewayApi.delete(
        `/api/v1/conversations/${conversationId}/messages/${messageId}`
      );
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Search for users to start a conversation with
   */
  async searchUsers(query: string): Promise<ChatUser[]> {
    try {
      const response = await gatewayApi.get<ChatUser[]>('/api/v1/users/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Leave a group conversation
   */
  async leaveConversation(conversationId: string): Promise<void> {
    try {
      await gatewayApi.post(`/api/v1/conversations/${conversationId}/leave`);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /**
   * Add participants to a group conversation
   */
  async addParticipants(
    conversationId: string,
    participantIds: string[]
  ): Promise<Conversation> {
    try {
      const response = await gatewayApi.post<Conversation>(
        `/api/v1/conversations/${conversationId}/participants`,
        { participantIds }
      );
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },
};

export default chatService;
