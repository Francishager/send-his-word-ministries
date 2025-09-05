import React from 'react';

export interface HeroSlide {
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  heightClass?: string; // e.g., "h-[420px]"
  autoAdvanceMs?: number;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides, heightClass = 'h-[420px]', autoAdvanceMs = 2000 }) => {
  const [index, setIndex] = React.useState(0);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fade, setFade] = React.useState(true);

  React.useEffect(() => {
    if (slides.length <= 1) return;
    timeoutRef.current && clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % slides.length);
        setFade(true);
      }, 150);
    }, autoAdvanceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, slides.length, autoAdvanceMs]);

  if (!slides.length) return null;

  const current = slides[index];

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden bg-gray-900`}>
      {/* Image */}
      <img
        key={index}
        src={current.src}
        alt={current.alt || current.title || 'Hero'}
        className={`absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity duration-700 ${fade ? 'opacity-80' : 'opacity-0'}`}
        loading="eager"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />

      {/* Content overlay */}
      <div className="relative z-10 max-w-6xl mx-auto h-full px-4 flex flex-col justify-center text-white">
        {current.title && <h1 className="text-3xl md:text-5xl font-extrabold mb-3">{current.title}</h1>}
        {current.subtitle && <p className="text-base md:text-lg text-gray-200 max-w-2xl mb-6">{current.subtitle}</p>}
        {current.ctaText && current.ctaHref && (
          <a
            href={current.ctaHref}
            className="inline-flex w-max items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {current.ctaText}
          </a>
        )}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full border border-white/60 ${i === index ? 'bg-white' : 'bg-white/30'}`}
              aria-label={`Slide ${i + 1}`}
            />)
          )}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
