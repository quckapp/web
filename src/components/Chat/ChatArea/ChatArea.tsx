import { MessageSquare } from 'lucide-react';
import type { Conversation, Message, ChatUser } from '../../../types/chat';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId?: string;
  typingUsers?: ChatUser[];
  isLoading?: boolean;
  hasMore?: boolean;
  onSendMessage: (content: string) => void;
  onLoadMore: () => void;
  onTyping: (isTyping: boolean) => void;
}

export default function ChatArea({
  conversation,
  messages,
  currentUserId,
  typingUsers = [],
  isLoading = false,
  hasMore = false,
  onSendMessage,
  onLoadMore,
  onTyping,
}: ChatAreaProps) {
  // Empty state when no conversation is selected
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <MessageSquare className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to Chat
          </h2>
          <p className="text-gray-500 max-w-sm">
            Select a conversation from the sidebar or start a new chat to begin
            messaging.
          </p>
        </div>
      </div>
    );
  }

  const isGroupChat = conversation.type === 'group';
  const conversationTypingUsers = typingUsers.filter(
    (u) => u.id !== currentUserId
  );
  const typingUserNames = conversationTypingUsers.map(
    (u) => u.displayName || u.firstName || 'Someone'
  );

  return (
    <div className="flex-1 flex flex-col bg-white">
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        typingUsers={typingUserNames}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUsers={conversationTypingUsers}
        isLoading={isLoading}
        hasMore={hasMore}
        isGroupChat={isGroupChat}
        onLoadMore={onLoadMore}
      />

      <MessageInput
        onSend={onSendMessage}
        onTyping={onTyping}
        placeholder={`Message ${conversation.name || 'chat'}...`}
      />
    </div>
  );
}
