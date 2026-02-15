import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar/Sidebar';
import ChatArea from './ChatArea/ChatArea';
import NewChatModal from './NewChatModal';

interface ChatLayoutProps {
  conversationId?: string;
}

export default function ChatLayout({ conversationId }: ChatLayoutProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const {
    conversations,
    currentConversation,
    messages,
    typingUsers,
    isLoading,
    isLoadingMessages,
    hasMoreMessages,
    error,
    selectConversation,
    sendMessage,
    createConversation,
    loadMoreMessages,
    setTyping,
    searchUsers,
  } = useChat();

  // Select conversation from URL param
  const handleSelectConversation = useCallback(
    async (id: string) => {
      await selectConversation(id);
      navigate(`/chat/${id}`, { replace: true });
    },
    [selectConversation, navigate]
  );

  // Handle initial conversation selection from URL
  useState(() => {
    if (conversationId && conversations.length > 0) {
      const exists = conversations.find((c) => c.id === conversationId);
      if (exists) {
        selectConversation(conversationId);
      }
    }
  });

  const handleNewChat = async (participantIds: string[], name?: string) => {
    const conversation = await createConversation(participantIds, name);
    await selectConversation(conversation.id);
    navigate(`/chat/${conversation.id}`, { replace: true });
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Get typing users for current conversation
  const currentTypingUsers = currentConversation
    ? typingUsers.get(currentConversation.id) || []
    : [];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={currentConversation?.id}
        currentUserId={currentUser?.id}
        onSelectConversation={handleSelectConversation}
        onNewChat={() => setIsNewChatOpen(true)}
        onSettings={handleSettings}
      />

      {/* Chat Area */}
      <ChatArea
        conversation={currentConversation}
        messages={messages}
        currentUserId={currentUser?.id}
        typingUsers={currentTypingUsers}
        isLoading={isLoadingMessages}
        hasMore={hasMoreMessages}
        onSendMessage={sendMessage}
        onLoadMore={loadMoreMessages}
        onTyping={setTyping}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 px-4 py-3 bg-red-600 text-white rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreateChat={handleNewChat}
        searchUsers={searchUsers}
      />
    </div>
  );
}
