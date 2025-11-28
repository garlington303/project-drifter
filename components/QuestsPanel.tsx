
import React from 'react';
import { Scroll } from 'lucide-react';

export const QuestsPanel: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500">
      <Scroll size={48} className="mb-4 text-neutral-600" />
      <h3 className="text-xl font-bold text-neutral-300">NO ACTIVE QUESTS</h3>
      <p className="mt-2 text-sm">Explore the world to find tasks.</p>
    </div>
  );
};
