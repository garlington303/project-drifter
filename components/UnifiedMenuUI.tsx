
import React, { useEffect, useState } from 'react';
import { InventorySystem } from '../systems/InventorySystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { PlayerEntity } from '../entities/PlayerEntity';
import { InputSystem } from '../systems/InputSystem';
import { InventoryPanel } from './InventoryPanel';
import { StatsPanel } from './StatsPanel';
import { SkillsPanel } from './SkillsPanel';
import { QuestsPanel } from './QuestsPanel';

interface UnifiedMenuUIProps {
  isOpen: boolean;
  inventory: InventorySystem;
  equipment: EquipmentSystem;
  player: PlayerEntity;
  input: InputSystem;
}

type Tab = 'inventory' | 'stats' | 'skills' | 'quests';

export const UnifiedMenuUI: React.FC<UnifiedMenuUIProps> = ({ 
  isOpen, 
  inventory, 
  equipment, 
  player,
  input
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  // Hack to force re-render when inventory changes
  const [updateCounter, setUpdateCounter] = useState(0); 
  const forceUpdate = () => setUpdateCounter(c => c + 1);

  // Listen for Number Keys to switch tabs
  useEffect(() => {
    if (!isOpen) return;

    // We check the input system state here roughly every frame via the parent loop, 
    // but for UI responsiveness inside the React tree, we can just use a native listener.
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '1') setActiveTab('inventory');
        if (e.key === '2') setActiveTab('stats');
        if (e.key === '3') setActiveTab('skills');
        if (e.key === '4') setActiveTab('quests');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* PAUSED Indicator */}
      <div className="absolute top-8 right-8 text-neutral-700 font-black text-6xl tracking-widest select-none opacity-20 rotate-12 pointer-events-none">
        PAUSED
      </div>

      {/* Main Container */}
      <div className="w-[800px] h-[600px] bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/50">
          <TabButton 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
            label="INVENTORY" 
            hotkey="1" 
          />
          <TabButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            label="STATS" 
            hotkey="2" 
          />
          <TabButton 
            active={activeTab === 'skills'} 
            onClick={() => setActiveTab('skills')} 
            label="SKILLS" 
            hotkey="3" 
          />
          <TabButton 
            active={activeTab === 'quests'} 
            onClick={() => setActiveTab('quests')} 
            label="QUESTS" 
            hotkey="4" 
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-hidden relative">
          {activeTab === 'inventory' && (
            <InventoryPanel 
                inventory={inventory} 
                equipment={equipment} 
                player={player} 
                onUpdate={forceUpdate} 
            />
          )}
          {activeTab === 'stats' && (
            <StatsPanel player={player} equipment={equipment} />
          )}
          {activeTab === 'skills' && <SkillsPanel />}
          {activeTab === 'quests' && <QuestsPanel />}
        </div>
      </div>
      
      {/* Footer Hint */}
      <div className="absolute bottom-8 text-neutral-500 font-mono text-sm">
        Press <span className="text-neutral-300 font-bold">TAB</span> or <span className="text-neutral-300 font-bold">ESC</span> to Close
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, hotkey }: { active: boolean, onClick: () => void, label: string, hotkey: string }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 py-4 text-sm font-bold tracking-wider relative transition-all duration-200
      ${active ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'}
    `}
  >
    {label}
    <span className="absolute top-2 right-2 text-[10px] opacity-30 font-mono">{hotkey}</span>
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
  </button>
);
