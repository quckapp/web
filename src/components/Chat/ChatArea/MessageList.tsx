import { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { Message, ChatUser } from '../../../types/chat';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import Timestamp from '../shared/Timestamp';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  typingUsers?: ChatUser[];
  isLoading?: boolean;
  hasMore?: boolean;
  isGroupChat?: boolean;
  onLoadMore?: () => void;
}

function shouldShowDateSeparator(
  currentMessage: Message,
  previousMessage?: Message
): boolean {
  if (!previousMessage) return true;

  const current = new Date(currentMessage.createdAt);
  const previous = new Date(previousMessage.createdAt);

  return (
    current.getFullYear() !== previous.getFullYear() ||
    current.getMonth() !== previous.getMonth() ||
    current.getDate() !== previous.getDate()
  );
}

function isGroupedWithPrevious(
  currentMessage: Message,
  previousMessage?: Message
): boolean {
  if (!previousMessage) return false;
  if (currentMessage.senderId !== previousMessage.senderId) return false;

  const current = new Date(currentMessage.createdAt);
  const previous = new Date(previousMessage.createdAt);
  const diffMinutes = (current.getTime() - previous.getTime()) / 60000;

  return diffMinutes < 2; // Group messages within 2 minutes
}

export default function MessageList({
  messages,
  currentUserId,
  typingUsers = [],
  isLoading = false,
  hasMore = false,
  isGroupChat = false,
  onLoadMore,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // New message added
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Handle scroll for loading more messages
  const handleScroll = () => {
    if (!containerRef.current || !hasMore || isLoading) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      onLoadMore?.();
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center py-2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Load earlier messages
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const previousMessage = messages[index - 1];
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        const isGrouped = isGroupedWithPrevious(message, previousMessage);
        const isMine = message.senderId === currentUserId;
        const showAvatar = !isGrouped && !isMine;
        const showName = isGroupChat && !isMine && !isGrouped;

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  <Timestamp date={message.createdAt} format="date" />
                </span>
              </div>
            )}
            <MessageItem
              message={message}
              isMine={isMine}
              showAvatar={showAvatar}
              showName={showName}
              isGrouped={isGrouped}
            />
          </div>
        );
      })}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicator
          names={typingUsers.map(
            (u) => u.displayName || u.firstName || u.email?.split('@')[0] || 'Someone'
          )}
        />
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
