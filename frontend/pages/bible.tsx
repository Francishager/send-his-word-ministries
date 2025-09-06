import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import FadeUp from '@/components/ux/FadeUp';
import toast from 'react-hot-toast';

// Very small list to get started. We can expand later or load from a JSON.
const BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
];

interface Verse { verse: number; text: string; }

export default function BiblePage() {
  const { isAuthenticated, user } = useAuth();
  const [book, setBook] = React.useState('John');
  const [chapter, setChapter] = React.useState(3);
  const [verses, setVerses] = React.useState<Verse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [highlights, setHighlights] = React.useState<number[]>([]); // verse numbers highlighted for current chapter
  const [translation, setTranslation] = React.useState<'kjv'|'web'|'asv'>('kjv');
  const [hoverVerse, setHoverVerse] = React.useState<number | null>(null);

  const loadChapter = async () => {
    setLoading(true);
    try {
      // Cache key per book,chapter,translation
      const key = `bible:${translation}:${book}:${chapter}`;
      const cachedRaw = localStorage.getItem(key);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && Array.isArray(cached.verses)) {
          setVerses(cached.verses as Verse[]);
          // TTL check: 24 hours
          const ttlMs = 24 * 60 * 60 * 1000;
          if (cached.ts && Date.now() - cached.ts < ttlMs) {
            // Fresh cache: load highlights (if auth) and skip fetch
            if (isAuthenticated) {
              await loadHighlights();
            } else {
              setHighlights([]);
            }
            return;
          }
        }
      }

      // Free Bible API: https://bible-api.com/{ref}?translation=kjv|web|asv
      const ref = encodeURIComponent(`${book} ${chapter}`);
      const res = await fetch(`https://bible-api.com/${ref}?translation=${translation}`);
      if (!res.ok) throw new Error('Failed to fetch chapter');
      const data = await res.json();
      const v: Verse[] = (data.verses || []).map((x: any) => ({ verse: x.verse, text: x.text }));
      setVerses(v);
      // Save to cache
      localStorage.setItem(key, JSON.stringify({ verses: v, ts: Date.now() }));
      if (isAuthenticated) {
        await loadHighlights();
      } else {
        setHighlights([]);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const loadHighlights = async () => {
    if (!isAuthenticated) return;
    const { data, error } = await supabase
      .from('bible_highlights')
      .select('verse_start, verse_end')
      .eq('user_id', (user as any)?.id)
      .eq('book', book)
      .eq('chapter', chapter);
    if (error) return; // ignore
    const set = new Set<number>();
    (data || []).forEach((r) => {
      const from = r.verse_start ?? 1;
      const to = r.verse_end ?? r.verse_start ?? from;
      for (let i = from; i <= to; i++) set.add(i);
    });
    setHighlights(Array.from(set));
  };

  React.useEffect(() => {
    loadChapter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter, translation]);

  const isHighlighted = (v: number) => highlights.includes(v);

  const toggleHighlight = async (v: number) => {
    if (!isAuthenticated) {
      toast.error('Please log in to highlight verses');
      return;
    }
    try {
      // If already highlighted, delete it; else insert
      if (isHighlighted(v)) {
        const { error } = await supabase
          .from('bible_highlights')
          .delete()
          .eq('user_id', (user as any)?.id)
          .eq('book', book)
          .eq('chapter', chapter)
          .eq('verse_start', v)
          .is('verse_end', null);
        if (error) throw error;
        setHighlights((prev) => prev.filter((n) => n !== v));
      } else {
        const payload = {
          user_id: (user as any)?.id,
          book,
          chapter,
          verse_start: v,
          verse_end: null as number | null,
        };
        const { error } = await supabase.from('bible_highlights').insert(payload);
        if (error) throw error;
        setHighlights((prev) => [...prev, v]);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update highlight');
    }
  };

  return (
    <MainLayout title="Bible | Send His Word" description="Read the Bible and save personal highlights.">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <FadeUp>
          <h1 className="text-2xl font-bold mb-4">Bible (KJV, via free API)</h1>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Book</label>
              <select value={book} onChange={(e) => setBook(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
                {BOOKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chapter</label>
              <input type="number" min={1} value={chapter} onChange={(e) => setChapter(parseInt(e.target.value || '1', 10))} className="w-28 rounded-md border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Translation</label>
              <select value={translation} onChange={(e) => setTranslation(e.target.value as any)} className="rounded-md border px-3 py-2 text-sm">
                <option value="kjv">KJV</option>
                <option value="web">WEB</option>
                <option value="asv">ASV</option>
              </select>
            </div>
            <button onClick={loadChapter} disabled={loading} className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">{loading ? 'Loading…' : 'Load'}</button>
          </div>

          {/* Chapter content */}
          <div className="rounded-xl border bg-white">
            {verses.length === 0 ? (
              <div className="p-4 text-gray-600">No verses loaded.</div>
            ) : (
              <div className="divide-y">
                {verses.map((v) => (
                  <div
                    key={v.verse}
                    className={`group relative p-3 sm:p-4 cursor-pointer ${isHighlighted(v.verse) ? 'bg-yellow-50' : ''}`}
                    onMouseEnter={() => setHoverVerse(v.verse)}
                    onMouseLeave={() => setHoverVerse((prev) => (prev === v.verse ? null : prev))}
                    onClick={() => toggleHighlight(v.verse)}
                  >
                    {/* Margin toolbar */}
                    <div className={`absolute right-3 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 ${hoverVerse === v.verse ? 'opacity-100' : ''}`} onClick={(e) => e.stopPropagation()}>
                      {isHighlighted(v.verse) && (
                        <span className="text-[10px] rounded-md border px-2 py-1 bg-yellow-100 text-yellow-800">Highlighted</span>
                      )}
                      <button
                        className="text-xs rounded-md border px-2 py-1 bg-white hover:bg-gray-50"
                        onClick={() => {
                          navigator.clipboard.writeText(`${book} ${chapter}:${v.verse} (${translation.toUpperCase()})\n${v.text.trim()}`);
                          toast.success('Copied');
                        }}
                      >Copy</button>
                      <button
                        className="text-xs rounded-md border px-2 py-1 bg-white hover:bg-gray-50"
                        onClick={async () => {
                          const text = `${book} ${chapter}:${v.verse} (${translation.toUpperCase()})\n${v.text.trim()}`;
                          const url = `${window.location.origin}/bible?book=${encodeURIComponent(book)}&chapter=${chapter}#v${v.verse}`;
                          if (navigator.share) {
                            try { await navigator.share({ title: `${book} ${chapter}:${v.verse}`, text, url }); } catch {}
                          } else {
                            await navigator.clipboard.writeText(`${text}\n${url}`);
                            toast.success('Share link copied');
                          }
                        }}
                      >Share</button>
                    </div>
                    <span id={`v${v.verse}`} className="text-xs text-gray-500 align-top mr-2">{v.verse}</span>
                    <span className="text-gray-800 whitespace-pre-wrap">{v.text.trim()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isAuthenticated && (
            <div className="text-sm text-gray-600 mt-3">Sign in to save your highlights.</div>
          )}
        </FadeUp>
      </section>
    </MainLayout>
  );
}
