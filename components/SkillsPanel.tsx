
import React from 'react';
import { Lock } from 'lucide-react';

export const SkillsPanel: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500">
      <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-800">
        <Lock size={48} />
      </div>
      <h3 className="text-xl font-bold text-neutral-300">SKILLS LOCKED</h3>
      <p className="mt-2 text-sm">Level up your survivor to unlock the skill tree.</p>
      
      <div className="grid grid-cols-4 gap-4 mt-8 opacity-50 pointer-events-none">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded"></div>
        ))}
      </div>
    </div>
  );
};
