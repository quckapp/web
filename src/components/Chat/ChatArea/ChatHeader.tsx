import { MoreVertical, Phone, Video, Info } from 'lucide-react';
import type { Conversation } from '../../../types/chat';
import Avatar from '../shared/Avatar';
import OnlineStatus from '../shared/OnlineStatus';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId?: string;
  typingUsers?: string[];
}

function getConversationInfo(
  conversation: Conversation,
  currentUserId?: string
): { name: string; subtitle: string; avatarSrc?: string; avatarName: string } {
  if (conversation.type === 'direct') {
    const other = conversation.participants.find((p) => p.id !== currentUserId);
    return {
      name: other?.displayName || other?.firstName || other?.email || 'Unknown',
      subtitle: other?.status === 'online' ? 'Online' : 'Offline',
      avatarSrc: other?.avatar,
      avatarName: other?.displayName || other?.firstName || '',
    };
  }

  const participantCount = conversation.participants.length;
  const onlineCount = conversation.participants.filter(
    (p) => p.status === 'online'
  ).length;

  return {
    name: conversation.name || 'Group Chat',
    subtitle: `${participantCount} members, ${onlineCount} online`,
    avatarSrc: conversation.avatar,
    avatarName: conversation.name || 'Group',
  };
}

export default function ChatHeader({
  conversation,
  currentUserId,
  typingUsers = [],
}: ChatHeaderProps) {
  const info = getConversationInfo(conversation, currentUserId);
  const otherParticipant =
    conversation.type === 'direct'
      ? conversation.participants.find((p) => p.id !== currentUserId)
      : null;

  return (
    <div className="h-16 px-4 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar
          src={info.avatarSrc}
          name={info.avatarName}
          size="md"
          status={otherParticipant?.status}
          showStatus={conversation.type === 'direct'}
        />

        <div>
          <h2 className="font-semibold text-gray-900">{info.name}</h2>
          {typingUsers.length > 0 ? (
            <p className="text-sm text-indigo-600 animate-pulse">
              {typingUsers.length === 1 ? 'typing...' : 'several people are typing...'}
            </p>
          ) : (
            <div className="flex items-center gap-1">
              {otherParticipant?.status && (
                <OnlineStatus status={otherParticipant.status} showLabel />
              )}
              {!otherParticipant && (
                <p className="text-sm text-gray-500">{info.subtitle}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Info className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
