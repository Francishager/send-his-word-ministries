import React from 'react';
import useWebSocket from '@/hooks/useWebSocket';
import { chatWsUrl } from '@/lib/ws';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id?: string;
  user?: string;
  text: string;
  ts?: string;
}

export default function ChatPanel({
  serviceId,
  canPost = false,
}: {
  serviceId: string;
  canPost?: boolean;
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [text, setText] = React.useState('');

  const { ready, error, send } = useWebSocket(() => chatWsUrl(serviceId), [serviceId], {
    onMessage: (msg) => {
      if (msg?.type === 'chat.message') {
        setMessages((prev) => [...prev, { text: msg.text, user: msg.user, ts: msg.ts }]);
      } else if (msg?.type === 'error') {
        toast.error('Chat error: ' + (msg.detail || 'Unknown error'));
      }
    },
  });

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const onSend = () => {
    if (!text.trim()) return;
    const ok = send({ type: 'chat.send', text });
    if (!ok) {
      toast.error('Connection not ready. Please try again.');
      return;
    }
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded border">
        {messages.map((m, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold">{m.user || 'Anon'}:</span> <span>{m.text}</span>
          </div>
        ))}
        {!messages.length && <div className="text-gray-500 text-sm">No messages yet.</div>}
      </div>
      <div className="mt-2">
        {canPost ? (
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={ready ? 'Type your message…' : 'Connecting…'}
              className="flex-1 rounded border px-3 py-2"
            />
            <button
              onClick={onSend}
              className="rounded bg-indigo-600 text-white px-3 py-2"
              disabled={!ready || !text.trim()}
            >
              Send
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-600">Sign in to chat.</div>
        )}
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>
    </div>
  );
}
