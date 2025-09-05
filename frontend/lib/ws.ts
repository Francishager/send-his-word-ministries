export function getWsBase(): string | null {
  if (typeof window === 'undefined') return null;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host; // includes port
  return `${proto}://${host}`;
}

export function chatWsUrl(serviceId: string): string | null {
  const base = getWsBase();
  if (!base) return null;
  return `${base}/ws/chat/${encodeURIComponent(serviceId)}/`;
}

export function prayerQueueWsUrl(): string | null {
  const base = getWsBase();
  if (!base) return null;
  return `${base}/ws/prayer/queue/`;
}
