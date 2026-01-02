
import React from 'react';
import { GAME_CONFIG } from '../constants';

interface SkillPanelProps {
  level: number;
  currentSkillLevels: Record<string, number>;
  onSelect: (skillId: string) => void;
}

export const SkillPanel: React.FC<SkillPanelProps> = ({ level, currentSkillLevels, onSelect }) => {
  const skillIds = ['kinetic_overload', 'shield_regen', 'dash_boost', 'scatter_shot'];

  const getSkillInfo = (id: string, currentLevel: number) => {
    switch(id) {
      case 'kinetic_overload':
        return { 
          title: "KINETIC OVERLOAD", 
          desc: "Increases projectile damage output by +20%." 
        };
      case 'shield_regen':
        return { 
          title: "SHIELD REGEN ACCEL", 
          desc: "Shield regenerates +15% faster." 
        };
      case 'dash_boost':
        return { 
          title: "DASH BOOST", 
          desc: "Adds +1 to maximum dash charges." 
        };
      case 'scatter_shot':
        if (currentLevel === 0) {
          return { 
            title: "MANA SCATTER SHOT", 
            desc: "Unlocks secondary fire: A high-impact shotgun burst (Right-Click)." 
          };
        } else {
          return { 
            title: "SCATTER ACCELERATOR", 
            desc: "Optimizes mana flow: Reduces Scatter Shot cooldown by 1.0s." 
          };
        }
      default:
        return { title: "UNKNOWN", desc: "" };
    }
  };

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-5xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]">
            LEVEL UP <span className="text-yellow-400">{level}</span>
          </h2>
          <p className="text-slate-400 uppercase tracking-widest text-sm mt-2">Select an Augmentation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skillIds.map((skillId) => {
            const currentLevel = currentSkillLevels[skillId] || 0;
            const config = (GAME_CONFIG.SKILL_CONFIG as any)[skillId];
            const maxLevel = config?.MAX || 5;
            const isMaxed = currentLevel >= maxLevel;
            const { title, desc } = getSkillInfo(skillId, currentLevel);

            return (
              <button
                key={skillId}
                disabled={isMaxed}
                onClick={() => onSelect(skillId)}
                className={`group relative flex flex-col p-6 border-2 transition-all duration-200 text-left outline-none overflow-hidden ${
                  isMaxed 
                    ? 'bg-slate-950/50 border-slate-800 cursor-not-allowed grayscale' 
                    : 'bg-slate-900/80 border-slate-700 hover:border-yellow-400 hover:bg-slate-800'
                }`}
              >
                {/* Decorative accent */}
                {!isMaxed && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/5 -rotate-45 translate-x-8 -translate-y-8 group-hover:bg-yellow-400/20 transition-colors" />
                )}
                
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-mono text-yellow-500/50 uppercase tracking-tighter">
                      {isMaxed ? 'CAP REACHED' : 'AVAILABLE UPGRADE'}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isMaxed ? 'bg-slate-800 text-slate-500' : 'bg-yellow-400/10 text-yellow-500'}`}>
                      RANK {currentLevel} / {maxLevel}
                    </span>
                  </div>
                  <h3 className={`text-xl font-bold tracking-tight transition-colors ${isMaxed ? 'text-slate-600' : 'text-white group-hover:text-yellow-400'}`}>
                    {title}
                  </h3>
                </div>
                
                <p className={`text-sm leading-relaxed mb-8 flex-grow ${isMaxed ? 'text-slate-700' : 'text-slate-400'}`}>
                  {isMaxed ? "Optimization complete. Maximum efficiency reached." : desc}
                </p>

                <div className={`flex items-center justify-between mt-auto pt-4 border-t ${isMaxed ? 'border-slate-800' : 'border-slate-700/50'}`}>
                  <span className="text-[10px] font-mono text-slate-500">RARITY: BASIC</span>
                  {!isMaxed ? (
                    <span className="text-xs font-bold text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">INSTALL ></span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600">MAXIMIZED</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
