import React from 'react';

function fmt(ms: number) {
  if (ms <= 0) return 'Live now';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  parts.push(`${h}h ${m}m ${sec}s`);
  return parts.join(' ');
}

export default function Countdown({ targetISO, title }: { targetISO: string; title?: string }) {
  const [now, setNow] = React.useState<number | null>(null);
  const target = React.useMemo(() => new Date(targetISO).getTime(), [targetISO]);

  React.useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const text = now ? fmt(Math.max(0, target - now)) : '';

  return (
    <div className="flex items-center gap-2">
      {title && <span className="font-semibold">{title}</span>}
      {/* Render empty on server and fill on client to avoid hydration mismatch */}
      <span suppressHydrationWarning>{text}</span>
    </div>
  );
}
