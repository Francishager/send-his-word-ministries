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
  heightClass?: string; // override default responsive heights
  autoAdvanceMs?: number;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  // Fill most of the viewport on desktop while keeping mobile compact
  heightClass = 'h-[360px] md:h-[70vh] lg:h-screen',
  autoAdvanceMs = 3500,
}) => {
  const [index, setIndex] = React.useState(0);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [animating, setAnimating] = React.useState(false);
  const nextImgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (slides.length <= 1) return;
    timeoutRef.current && clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAnimating(true);
      // Allow the transition to play (must match duration below ~1000ms)
      const transMs = 1000;
      const id = setTimeout(() => {
        setIndex((prev) => (prev + 1) % slides.length);
        setAnimating(false);
      }, transMs);
      return () => clearTimeout(id);
    }, autoAdvanceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, slides.length, autoAdvanceMs]);

  // Preload next image to avoid flicker
  React.useEffect(() => {
    if (!slides.length) return;
    const nextIndex = (index + 1) % slides.length;
    const img = new Image();
    img.src = slides[nextIndex].src;
    nextImgRef.current = img as any;
  }, [index, slides]);

  if (!slides.length) return null;

  const current = slides[index];
  const nextIndex = (index + 1) % slides.length;
  const next = slides[nextIndex];

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden bg-gray-900`}>
      {/* Stacked images for seamless crossfade + slide */}
      {/* Current image */}
      <img
        src={current.src}
        alt={current.alt || current.title || 'Hero'}
        className={`absolute inset-0 w-full h-full object-cover object-center md:object-[50%_30%] opacity-80 transition-all duration-[1000ms] ease-in-out
          ${animating ? '-translate-x-2 opacity-0 scale-[1.02]' : 'translate-x-0 opacity-80 scale-[1.04]'}
        `}
        loading="eager"
      />
      {/* Next image */}
      <img
        src={next.src}
        alt={next.alt || next.title || 'Hero next'}
        className={`absolute inset-0 w-full h-full object-cover object-center md:object-[50%_30%] opacity-0 transition-all duration-[1000ms] ease-in-out
          ${animating ? 'translate-x-0 opacity-80 scale-[1.04]' : 'translate-x-2 opacity-0 scale-[1.02]'}
        `}
        aria-hidden
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
    </div>
  );
};

export default HeroSlider;
