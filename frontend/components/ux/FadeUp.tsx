import * as React from 'react';

interface FadeUpProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
  threshold?: number;
  delayMs?: number;
}

export default function FadeUp({ as = 'div', threshold = 0.15, delayMs = 0, className = '', children, ...rest }: FadeUpProps) {
  const Ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = Ref.current as Element | null;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delayMs) {
              const id = setTimeout(() => setVisible(true), delayMs);
              return () => clearTimeout(id as any);
            }
            setVisible(true);
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, delayMs]);

  const Component: any = as;
  return (
    <Component
      ref={Ref as any}
      className={
        `${className} transition-all duration-700 ease-out will-change-transform will-change-opacity ` +
        (visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6')
      }
      {...rest}
    >
      {children}
    </Component>
  );
}
