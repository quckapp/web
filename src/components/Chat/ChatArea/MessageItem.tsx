import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '../../../types/chat';
import Avatar from '../shared/Avatar';
import Timestamp from '../shared/Timestamp';

interface MessageItemProps {
  message: Message;
  isMine: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  isGrouped?: boolean;
}

export default function MessageItem({
  message,
  isMine,
  showAvatar = true,
  showName = false,
  isGrouped = false,
}: MessageItemProps) {
  const isOptimistic = message.id.startsWith('temp-');

  return (
    <div
      className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''} ${
        isGrouped ? 'mt-0.5' : 'mt-3'
      }`}
    >
      {/* Avatar */}
      {showAvatar && !isMine ? (
        <Avatar
          src={message.sender?.avatar}
          name={message.sender?.displayName || message.sender?.firstName}
          size="sm"
        />
      ) : !isMine ? (
        <div className="w-8" /> // Spacer for alignment
      ) : null}

      {/* Message Content */}
      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name for group chats */}
        {showName && !isMine && (
          <p className="text-xs text-gray-500 mb-1 ml-1">
            {message.sender?.displayName ||
              message.sender?.firstName ||
              message.sender?.email}
          </p>
        )}

        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isMine
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          } ${isOptimistic ? 'opacity-70' : ''}`}
        >
          {message.type === 'text' && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {message.type === 'system' && (
            <p className="text-xs text-center text-gray-500 italic">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp and read status */}
        <div
          className={`flex items-center gap-1 mt-1 ${
            isMine ? 'justify-end' : 'justify-start'
          }`}
        >
          <Timestamp date={message.createdAt} format="time" />
          {isMine && !isOptimistic && (
            <span className="text-gray-400">
              {message.readBy.length > 1 ? (
                <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
