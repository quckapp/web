import type { Conversation } from '../../../types/chat';
import Avatar from '../shared/Avatar';
import Timestamp from '../shared/Timestamp';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId?: string;
  onClick: () => void;
}

function getConversationName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.name) return conversation.name;

  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUserId
    );
    return (
      otherParticipant?.displayName ||
      otherParticipant?.firstName ||
      otherParticipant?.email ||
      'Unknown User'
    );
  }

  // Group conversation without a name
  const names = conversation.participants
    .filter((p) => p.id !== currentUserId)
    .slice(0, 3)
    .map((p) => p.displayName || p.firstName || p.email?.split('@')[0])
    .join(', ');

  return names || 'Group Chat';
}

function getConversationAvatar(conversation: Conversation, currentUserId?: string): {
  src?: string;
  name: string;
} {
  if (conversation.avatar) {
    return { src: conversation.avatar, name: conversation.name || '' };
  }

  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUserId
    );
    return {
      src: otherParticipant?.avatar,
      name: otherParticipant?.displayName || otherParticipant?.firstName || '',
    };
  }

  return { name: conversation.name || 'Group' };
}

function getOtherParticipantStatus(conversation: Conversation, currentUserId?: string) {
  if (conversation.type !== 'direct') return undefined;
  const otherParticipant = conversation.participants.find(
    (p) => p.id !== currentUserId
  );
  return otherParticipant?.status;
}

export default function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onClick,
}: ConversationItemProps) {
  const name = getConversationName(conversation, currentUserId);
  const avatar = getConversationAvatar(conversation, currentUserId);
  const status = getOtherParticipantStatus(conversation, currentUserId);
  const lastMessage = conversation.lastMessage;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-indigo-50 border-l-2 border-indigo-600'
          : 'hover:bg-gray-50'
      }`}
    >
      <Avatar
        src={avatar.src}
        name={avatar.name}
        size="md"
        status={status}
        showStatus={conversation.type === 'direct'}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`font-medium truncate ${
              isActive ? 'text-indigo-900' : 'text-gray-900'
            }`}
          >
            {name}
          </h3>
          {lastMessage && (
            <Timestamp
              date={lastMessage.createdAt}
              format="relative"
              className="flex-shrink-0"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-gray-500 truncate">
            {lastMessage?.content || 'No messages yet'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-xs font-medium rounded-full">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
