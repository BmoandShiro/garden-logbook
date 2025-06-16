import React, { useEffect, useRef, useState } from "react";

/**
 * Spinner - A reusable loading spinner with a green conic-gradient ring and hollow center.
 * Usage: <Spinner className="h-8 w-8" />
 */
export function Spinner({ className = "h-12 w-12" }: { className?: string }) {
  const [angle, setAngle] = useState(0);
  const [mounted, setMounted] = useState(false);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const animate = () => {
      setAngle((a) => (a + 0.5) % 360); // slower spin
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (typeof requestRef.current === "number") {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [mounted]);

  // Fewer dots
  const rings = 7;
  const dotsPerRing = 14;
  const rad = (mounted ? angle : 0) * Math.PI / 180;
  const dots = [];
  for (let i = 0; i < rings; i++) {
    const phi = Math.PI * (i / (rings - 1));
    for (let j = 0; j < dotsPerRing; j++) {
      const theta = (2 * Math.PI * j) / dotsPerRing + rad;
      const x3d = Math.sin(phi) * Math.cos(theta);
      const y3d = Math.cos(phi);
      const z3d = Math.sin(phi) * Math.sin(theta);
      const perspective = 1.5 / (2 - z3d);
      const x = 25 + 20 * x3d * perspective;
      const y = 25 + 20 * y3d * perspective;
      dots.push(
        <circle
          key={`${i}-${j}`}
          cx={x.toFixed(4)}
          cy={y.toFixed(4)}
          r="1.5"
          fill="#34d399"
          opacity={0.7 + 0.3 * (z3d + 1) / 2}
        />
      );
    }
  }

  return (
    <svg
      className={className}
      viewBox="0 0 50 50"
      aria-label="Loading"
      style={{ display: "block" }}
    >
      {dots}
    </svg>
  );
}

// Note: Do not use border classes with this spinner. The hollow effect is achieved via mask-image in CSS.

// Add the following CSS to your global stylesheet (e.g., app/globals.css):
// .gradient-spinner {
//   background: conic-gradient(from 0deg, #34d399, #059669 120deg, #34d399 360deg);
//   -webkit-mask-image: radial-gradient(circle, white 60%, transparent 61%);
//   mask-image: radial-gradient(circle, white 60%, transparent 61%);
// } 