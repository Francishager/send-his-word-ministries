import { useEffect, useMemo, useState } from 'react';
import { get } from '@/lib/api';

export interface ServiceDTO {
  id: string;
  title: string;
  description?: string;
  status: 'wait' | 'started' | 'ended' | string;
  start_time?: string; // ISO
  end_time?: string; // ISO
  created_at?: string;
}

function parseDate(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Compute the next occurrence of a weekly schedule. Defaults to Sunday 10:00 local time.
 * You can override via env:
 * - NEXT_PUBLIC_DEFAULT_SERVICE_DAY: 0-6 (0=Sunday)
 * - NEXT_PUBLIC_DEFAULT_SERVICE_TIME: HH:MM (24h) e.g. "10:00"
 */
function computeDefaultNextService(): ServiceDTO {
  const dayEnv = process.env.NEXT_PUBLIC_DEFAULT_SERVICE_DAY;
  const timeEnv = process.env.NEXT_PUBLIC_DEFAULT_SERVICE_TIME || '10:00';
  const targetDow = Number.isInteger(Number(dayEnv)) ? Math.max(0, Math.min(6, Number(dayEnv))) : 0; // Sunday
  const [hhStr, mmStr] = timeEnv.split(':');
  const targetHour = Math.max(0, Math.min(23, parseInt(hhStr || '10', 10)));
  const targetMin = Math.max(0, Math.min(59, parseInt(mmStr || '0', 10)));

  const now = new Date();
  const d = new Date(now);
  const currentDow = d.getDay();
  let addDays = (targetDow - currentDow + 7) % 7;
  // if today and time already passed, push to next week
  const candidate = new Date(d);
  candidate.setDate(d.getDate() + addDays);
  candidate.setHours(targetHour, targetMin, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return {
    id: 'fallback-next-service',
    title: 'Upcoming Service',
    description: 'Auto-scheduled upcoming service',
    status: 'wait',
    start_time: candidate.toISOString(),
    end_time: undefined,
    created_at: new Date().toISOString(),
  };
}

export function useNextService() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<ServiceDTO | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        // Prefer waiting services ordered by start_time
        const waiting = await get<ServiceDTO[]>(`/services/`, {
          params: { ordering: 'start_time', status: 'wait', limit: 1 },
          auth: false,
        });
        let candidate: ServiceDTO | null = null;
        if (Array.isArray(waiting) && waiting.length) {
          candidate = waiting[0];
        } else {
          // Fallback: get all and pick nearest future by start_time
          const all = await get<ServiceDTO[]>(`/services/`, {
            params: { ordering: 'start_time' },
            auth: false,
          });
          const now = Date.now();
          const future = (all || []).filter((s) => {
            const st = parseDate(s.start_time)?.getTime();
            return st && st > now;
          });
          future.sort(
            (a, b) => parseDate(a.start_time)!.getTime() - parseDate(b.start_time)!.getTime()
          );
          candidate = future[0] || null;
        }
        if (isMounted) {
          // If no candidate from API, synthesize one so countdown works instead of breaking
          setService(candidate ?? computeDefaultNextService());
        }
      } catch (e: any) {
        // Record error but still provide a default so the live page shows a countdown
        if (isMounted) {
          setError(e?.message || 'Failed to load next service');
          setService(computeDefaultNextService());
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    run();
    const id = setInterval(run, 60_000); // refresh every minute
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  const startDate = useMemo(() => parseDate(service?.start_time), [service?.start_time]);
  const isLive =
    service?.status === 'started' || (!!startDate && startDate.getTime() <= Date.now());

  return { loading, error, service, startDate, isLive };
}

export default useNextService;
