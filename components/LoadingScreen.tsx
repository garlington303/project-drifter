import React from 'react';

interface LoadingScreenProps {
  progress: number; // 0.0 to 1.0
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const percentage = Math.round(progress * 100);

  return (
    <div className="fixed inset-0 z-[10000] bg-neutral-950 flex flex-col items-center justify-center text-white">
      <div className="mb-8 text-4xl font-bold tracking-widest animate-pulse text-emerald-500">
        PROJECT DRIFTER
      </div>
      
      <div className="w-96 h-4 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700 relative">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300 ease-out relative"
          style={{ width: `${percentage}%` }}
        >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] skew-x-12"></div>
        </div>
      </div>
      
      <div className="mt-4 font-mono text-neutral-400 text-sm">
        LOADING ASSETS... {percentage}%
      </div>

      <div className="mt-12 text-xs text-neutral-600 italic max-w-md text-center">
        "Did you know? Drifters often find rare artifacts in the deepest forests."
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
    </div>
  );
};
