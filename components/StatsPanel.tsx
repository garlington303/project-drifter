
import React from 'react';
import { PlayerEntity } from '../entities/PlayerEntity';
import { EquipmentSystem } from '../systems/EquipmentSystem';

interface StatsPanelProps {
  player: PlayerEntity;
  equipment: EquipmentSystem;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ player, equipment }) => {
  const bonus = equipment.getTotalBonusStats();
  
  // Helper to render a stat row
  const StatRow = ({ label, base, bonusVal, unit = '' }: { label: string, base: number, bonusVal?: number, unit?: string }) => (
    <div className="flex justify-between items-center py-3 border-b border-neutral-800 last:border-0 hover:bg-neutral-900/30 px-2 rounded transition-colors">
      <span className="text-neutral-400 font-medium">{label}</span>
      <div className="font-mono">
        <span className="text-neutral-200 text-lg">{base + (bonusVal || 0)}{unit}</span>
        {bonusVal && bonusVal > 0 && <span className="text-emerald-500 text-sm ml-2 font-bold">(+{bonusVal})</span>}
      </div>
    </div>
  );

  return (
    <div className="h-full p-4 flex flex-col items-center">
      
      {/* Header / Character Info */}
      <div className="w-full max-w-2xl bg-neutral-900/50 p-6 rounded-lg border border-neutral-800 mb-6 flex items-center gap-6">
         <div className="w-20 h-20 bg-neutral-800 rounded-full border-2 border-emerald-500 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            👤
         </div>
         <div className="flex-1">
            <h2 className="text-2xl font-bold text-white tracking-wider">DRIFTER</h2>
            <div className="text-emerald-400 font-mono text-sm mb-2">LEVEL {player.level} SURVIVOR</div>
            <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden border border-neutral-700">
                <div className="bg-emerald-600 h-full w-[85%] relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 skew-x-12 -ml-4 w-4"></div>
                </div>
            </div>
            <div className="flex justify-between text-xs mt-1 font-mono text-neutral-500">
               <span>XP: 8,500 / 10,000</span>
               <span>{player.currentHealth} / {player.maxHealth} HP</span>
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-8">
          
          {/* Combat Stats */}
          <div className="bg-neutral-900/30 p-4 rounded-lg border border-neutral-800">
             <h3 className="text-emerald-500 font-bold uppercase tracking-widest mb-4 text-sm border-b border-neutral-800 pb-2">Combat Attributes</h3>
             <StatRow label="Attack Power" base={player.baseAttack} bonusVal={bonus.attack} />
             <StatRow label="Defense Rating" base={player.baseDefense} bonusVal={bonus.defense} />
             <StatRow label="Critical Chance" base={5} unit="%" />
             <StatRow label="Attack Speed" base={100} unit="%" />
          </div>

          {/* Survival Stats */}
          <div className="bg-neutral-900/30 p-4 rounded-lg border border-neutral-800">
             <h3 className="text-blue-500 font-bold uppercase tracking-widest mb-4 text-sm border-b border-neutral-800 pb-2">Survival Attributes</h3>
             <StatRow label="Max Health" base={player.maxHealth} bonusVal={bonus.health} />
             <StatRow label="Movement Speed" base={player.baseSpeed} bonusVal={bonus.speed} />
             <StatRow label="Dash Cooldown" base={100} unit="%" />
             <StatRow label="Stamina Regen" base={5} unit="/s" />
          </div>

      </div>
    </div>
  );
};
