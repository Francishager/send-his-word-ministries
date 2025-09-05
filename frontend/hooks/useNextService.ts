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
          const all = await get<ServiceDTO[]>(`/services/`, { params: { ordering: 'start_time' }, auth: false });
          const now = Date.now();
          const future = (all || []).filter(s => {
            const st = parseDate(s.start_time)?.getTime();
            return st && st > now;
          });
          future.sort((a, b) => (parseDate(a.start_time)!.getTime() - parseDate(b.start_time)!.getTime()));
          candidate = future[0] || null;
        }
        if (isMounted) setService(candidate);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load next service');
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
  const isLive = service?.status === 'started' || (!!startDate && startDate.getTime() <= Date.now());

  return { loading, error, service, startDate, isLive };
}

export default useNextService;
