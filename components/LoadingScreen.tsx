
import React from 'react';

interface LoadingScreenProps {
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-[100] select-none">
      <div className="text-4xl font-bold text-emerald-500 mb-2 tracking-widest animate-pulse font-mono">
        PROJECT DRIFTER
      </div>
      <div className="text-neutral-500 text-sm font-mono mb-8 tracking-wide">
        INITIALIZING WORLD SIMULATION...
      </div>
      
      <div className="w-96 h-1 bg-neutral-900 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      
      <div className="mt-4 text-neutral-600 font-mono text-xs">
        ASSETS: {Math.round(progress * 100)}%
      </div>
    </div>
  );
};
