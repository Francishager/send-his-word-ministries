import React from 'react';
import useWebSocket from '@/hooks/useWebSocket';
import { prayerQueueWsUrl } from '@/lib/ws';
import { toast } from 'react-hot-toast';

interface QueueItem {
  id: string;
  user?: string;
  ts?: string;
  status?: string; // waiting|assigned|done
}

export default function PrayerQueue({ canRequest = false }: { canRequest?: boolean }) {
  const [queue, setQueue] = React.useState<QueueItem[]>([]);

  const { ready, error, send } = useWebSocket(
    () => prayerQueueWsUrl(),
    [],
    {
      onMessage: (msg) => {
        if (msg?.type === 'queue.snapshot') {
          setQueue(msg.items || []);
        } else if (msg?.type === 'queue.joined') {
          setQueue((prev) => [...prev, msg.item]);
        } else if (msg?.type === 'queue.updated') {
          setQueue((prev) => prev.map((q) => (q.id === msg.item?.id ? { ...q, ...msg.item } : q)));
        } else if (msg?.type === 'error') {
          toast.error('Prayer queue error: ' + (msg.detail || 'Unknown error'));
        }
      },
    }
  );

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const onRequestPrayer = () => {
    const ok = send({ type: 'queue.request' });
    if (!ok) toast.error('Connection not ready. Please try again.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Prayer Queue</h3>
        {canRequest && (
          <button onClick={onRequestPrayer} disabled={!ready} className="rounded bg-indigo-600 text-white px-3 py-1.5">
            Request Prayer
          </button>
        )}
      </div>
      <div className="rounded border bg-white divide-y">
        {queue.length === 0 && <div className="p-3 text-gray-600 text-sm">No one in queue yet.</div>}
        {queue.map((item) => (
          <div key={item.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{item.user || 'Anon'}</div>
              <div className="text-xs text-gray-500">{item.status || 'waiting'}</div>
            </div>
            <div className="text-xs text-gray-500">{item.ts}</div>
          </div>
        ))}
      </div>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}
