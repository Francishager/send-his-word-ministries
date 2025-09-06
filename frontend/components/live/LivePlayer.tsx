import React from 'react';

export type LiveProvider = 'youtube' | 'vimeo' | 'mux' | 'generic';

export interface LivePlayerProps {
  provider: LiveProvider;
  /**
   * For YouTube, pass a videoId; for Vimeo, pass a videoId; for mux/generic, pass a full embed URL.
   */
  sourceIdOrUrl: string;
  title?: string;
  className?: string;
}

function buildEmbedUrl(provider: LiveProvider, sourceIdOrUrl: string): string {
  switch (provider) {
    case 'youtube':
      // sourceIdOrUrl = videoId
      return `https://www.youtube.com/embed/${sourceIdOrUrl}?autoplay=1&modestbranding=1&rel=0`;
    case 'vimeo':
      // sourceIdOrUrl = videoId
      return `https://player.vimeo.com/video/${sourceIdOrUrl}?autoplay=1`;
    case 'mux':
    case 'generic':
      // expect a full embed URL
      return sourceIdOrUrl;
    default:
      return '';
  }
}

const LivePlayer: React.FC<LivePlayerProps> = ({
  provider,
  sourceIdOrUrl,
  title = 'Live Player',
  className = '',
}) => {
  const src = buildEmbedUrl(provider, sourceIdOrUrl);
  if (!src) return null;

  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        className="w-full h-full"
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

export default LivePlayer;
