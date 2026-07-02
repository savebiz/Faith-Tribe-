import React, { useEffect, useRef, useState } from 'react';

export function FullWidthWordmark({ text = 'FaithTribe' }: { text?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [letterSpacing, setLetterSpacing] = useState(0);

  useEffect(() => {
    const fit = () => {
      const container = containerRef.current;
      const el = textRef.current;
      if (!container || !el) return;

      // Measure natural width at zero letter-spacing
      el.style.letterSpacing = '0px';
      const naturalWidth = el.getBoundingClientRect().width;
      const containerWidth = container.getBoundingClientRect().width;
      const charCount = text.length;

      // Distribute the width difference evenly across the gaps between characters
      const extraSpace = containerWidth - naturalWidth;
      const spacingPerGap = extraSpace / (charCount - 1);

      // Clamp so spacing never goes absurdly negative (condensed) or absurdly wide
      const clamped = Math.max(-4, Math.min(spacingPerGap, 60));
      setLetterSpacing(clamped);
    };

    fit();
    const observer = new ResizeObserver(fit);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden leading-none select-none mt-4 text-center">
      <span
        ref={textRef}
        className="font-display inline-block whitespace-nowrap text-white/95"
        style={{
          fontSize: 'clamp(3rem, 12vw, 9rem)', // modest fluid range
          fontWeight: 700, // Fredoka's true heaviest cut
          letterSpacing: `${letterSpacing}px`,
        }}
      >
        {text}
      </span>
    </div>
  );
}
