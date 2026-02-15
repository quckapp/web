import { useState } from 'react';
import { MessageSquare, Settings, LogOut } from 'lucide-react';
import type { Conversation } from '../../../types/chat';
import SearchBar from './SearchBar';
import NewChatButton from './NewChatButton';
import ConversationItem from './ConversationItem';
import { useAuth } from '../../../contexts/AuthContext';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onSettings: () => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  currentUserId,
  onSelectConversation,
  onNewChat,
  onSettings,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { logout, currentUser } = useAuth();

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    // Search by conversation name
    if (conv.name?.toLowerCase().includes(query)) return true;

    // Search by participant names
    return conv.participants.some(
      (p) =>
        p.displayName?.toLowerCase().includes(query) ||
        p.firstName?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">Chats</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onSettings}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* New Chat Button */}
      <div className="p-4 pb-2">
        <NewChatButton onClick={onNewChat} />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-400 mt-1">
                Start a new chat to get started
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                currentUserId={currentUserId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* User info footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-600">
              {currentUser?.firstName?.charAt(0) ||
                currentUser?.email?.charAt(0).toUpperCase() ||
                '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser?.displayName ||
                currentUser?.firstName ||
                currentUser?.email}
            </p>
            <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
