'use client';

import { useState, useEffect, useRef } from 'react';

interface LaserPointerProps {
  isActive: boolean;
}

interface LaserPoint {
  x: number;
  y: number;
  timestamp: number;
}

export function LaserPointer({ isActive }: LaserPointerProps) {
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      setLaserPoints([]);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setCurrentPos({ x, y });
      setLaserPoints(prev => [...prev, { x, y, timestamp: Date.now() }]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isActive]);

  // Clean up old laser points
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setLaserPoints(prev => prev.filter(p => now - p.timestamp < 500)); // Keep for 500ms
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    >
      {/* Laser trail */}
      <svg className="w-full h-full">
        {laserPoints.map((point, i) => {
          if (i === 0) return null;
          const prevPoint = laserPoints[i - 1];
          const age = Date.now() - point.timestamp;
          const opacity = Math.max(0, 1 - age / 500);
          
          return (
            <line
              key={`${point.timestamp}-${i}`}
              x1={prevPoint.x}
              y1={prevPoint.y}
              x2={point.x}
              y2={point.y}
              stroke="red"
              strokeWidth="3"
              strokeOpacity={opacity}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Laser pointer dot */}
      <div
        className="absolute w-4 h-4 bg-red-500 rounded-full shadow-lg"
        style={{
          left: currentPos.x - 8,
          top: currentPos.y - 8,
          boxShadow: '0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.5)',
        }}
      />
    </div>
  );
}

