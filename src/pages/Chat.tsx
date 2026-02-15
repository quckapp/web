import { useParams } from 'react-router-dom';
import ChatLayout from '../components/Chat/ChatLayout';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();

  return <ChatLayout conversationId={conversationId} />;
}
