import React, { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  side: 'left' | 'right';
  onMove: (data: { x: number; y: number; active: boolean }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ side, onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  
  const MAX_RADIUS = 50; 

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleStart = (e: TouchEvent) => {
      e.preventDefault();
      // Only accept new touches if we aren't already tracking one
      if (touchIdRef.current !== null) return;

      // Find a touch that is roughly in our zone
      // For simplicity in this prototype, we treat the div as the zone
      // but we want the joystick to center on the initial touch if possible, 
      // OR just stay static. Static is more reliable for web.
      const touch = Array.from(e.changedTouches)[0];
      if (touch) {
        touchIdRef.current = touch.identifier;
        setActive(true);
        // Calculate initial offset relative to center of the container
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // For a static joystick, the center is fixed. 
        // We just track the delta from the center.
        updateJoystick(touch.clientX, touch.clientY, centerX, centerY);
      }
    };

    const handleMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scroll
      if (touchIdRef.current === null) return;
      
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
      if (touch) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        updateJoystick(touch.clientX, touch.clientY, centerX, centerY);
      }
    };

    const handleEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (touchIdRef.current === null) return;

      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
      if (touch) {
        touchIdRef.current = null;
        setActive(false);
        setPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0, active: false });
      }
    };

    const updateJoystick = (clientX: number, clientY: number, centerX: number, centerY: number) => {
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > MAX_RADIUS) {
        const scale = MAX_RADIUS / dist;
        dx *= scale;
        dy *= scale;
      }

      setPos({ x: dx, y: dy });
      // Normalize -1 to 1
      onMove({ 
        x: dx / MAX_RADIUS, 
        y: dy / MAX_RADIUS,
        active: true 
      });
    };

    container.addEventListener('touchstart', handleStart, { passive: false });
    // Attach move/end to window to handle dragging outside the visual circle
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd, { passive: false });
    window.addEventListener('touchcancel', handleEnd, { passive: false });
    
    return () => {
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [onMove]);

  return (
    <div 
      ref={containerRef}
      className={`absolute bottom-8 ${side === 'left' ? 'left-8' : 'right-8'} w-40 h-40 rounded-full bg-slate-900/30 backdrop-blur-sm border-2 border-white/10 touch-none flex items-center justify-center pointer-events-auto select-none`}
    >
      {/* Inner Stick */}
      <div 
        className={`w-16 h-16 rounded-full transition-transform duration-75 ease-out ${active ? 'bg-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.6)]' : 'bg-slate-400/30'}`}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      />
    </div>
  );
};
