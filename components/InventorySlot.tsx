/**
 * InventorySlot - Memoized inventory slot component with smooth animations
 * Optimized for 60 FPS drag-drop interactions
 */

import React, { memo, useCallback, useState, useRef } from 'react';
import { Item, Rarity, EquipmentSlot } from '../utils/gameUtils';
import { DragSource, getRarityBorderColor, getRarityGlowColor } from '../systems/DragDropSystem';
import { SoundEffects, playHoverSound } from '../utils/SoundEffects';

interface InventorySlotProps {
  item: Item | null;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  isValidDropTarget: boolean;
  isInvalidDropTarget: boolean;
  onDragStart: (index: number, e: React.MouseEvent) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  onRightClick: (index: number) => void;
  animationDelay?: number;
}

// Tooltip content component - memoized
const ItemTooltipContent = memo(({ item }: { item: Item }) => (
  <>
    <div className="flex justify-between items-start mb-1">
      <span
        className="font-bold text-sm"
        style={{
          color:
            item.rarity === Rarity.Legendary ? '#fbbf24' :
            item.rarity === Rarity.Epic ? '#c084fc' :
            item.rarity === Rarity.Rare ? '#60a5fa' :
            item.rarity === Rarity.Uncommon ? '#34d399' : '#e5e5e5'
        }}
      >
        {item.name}
      </span>
      {item.slot && (
        <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 ml-2">
          {item.slot}
        </span>
      )}
    </div>

    <div className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2 border-b border-neutral-800 pb-1">
      {item.type} • {item.rarity}
    </div>
    <div className="text-xs text-neutral-400 leading-relaxed italic mb-2">
      "{item.description}"
    </div>

    {item.stats && (
      <div className="space-y-1 mt-2 pt-2 border-t border-neutral-800">
        {item.stats.attack && (
          <div className="text-xs text-emerald-400 flex justify-between">
            <span>⚔️ Attack Power</span>
            <span>+{item.stats.attack}</span>
          </div>
        )}
        {item.stats.defense && (
          <div className="text-xs text-blue-400 flex justify-between">
            <span>🛡️ Defense</span>
            <span>+{item.stats.defense}</span>
          </div>
        )}
        {item.stats.speed && (
          <div className="text-xs text-amber-400 flex justify-between">
            <span>⚡ Speed</span>
            <span>+{item.stats.speed}</span>
          </div>
        )}
        {item.stats.health && (
          <div className="text-xs text-red-400 flex justify-between">
            <span>❤️ Max HP</span>
            <span>+{item.stats.health}</span>
          </div>
        )}
      </div>
    )}

    <div className="mt-2 pt-2 border-t border-neutral-800 text-[10px] text-neutral-600">
      Right-click to quick-equip
    </div>
  </>
));

ItemTooltipContent.displayName = 'ItemTooltipContent';

export const InventorySlot: React.FC<InventorySlotProps> = memo(({
  item,
  index,
  isSelected,
  isDragging,
  isValidDropTarget,
  isInvalidDropTarget,
  onDragStart,
  onDragEnd,
  onDrop,
  onHover,
  onClick,
  onRightClick,
  animationDelay = 0
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const row = Math.floor(index / 5);
  const isBottomRow = row >= 3;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPressed(true);
    if (item) {
      SoundEffects.itemPickup();
      onDragStart(index, e);
    }
  }, [item, index, onDragStart]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    onDragEnd();
  }, [onDragEnd]);

  const handleMouseEnter = useCallback(() => {
    onHover(index);
    if (item) {
      playHoverSound();
      // Delayed tooltip
      tooltipTimeout.current = setTimeout(() => {
        setShowTooltip(true);
      }, 300);
    }
  }, [index, item, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
    setShowTooltip(false);
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = null;
    }
  }, [onHover]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEffects.buttonClick();
    onClick(index);
  }, [index, onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRightClick(index);
  }, [index, onRightClick]);

  const handleDrop = useCallback(() => {
    SoundEffects.itemDrop();
    onDrop(index);
  }, [index, onDrop]);

  // Dynamic styles for smooth animations
  const slotStyle: React.CSSProperties = {
    animationDelay: `${animationDelay}ms`,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isPressed ? 'scale(0.95)' : isSelected ? 'scale(1.02)' : 'scale(1)',
    ...(item && {
      borderColor: isSelected ? 'transparent' : getRarityBorderColor(item.rarity),
      boxShadow: isSelected 
        ? `0 0 0 2px #e5e5e5, 0 0 20px ${getRarityGlowColor(item.rarity)}`
        : isValidDropTarget
          ? '0 0 12px rgba(34, 197, 94, 0.6), inset 0 0 8px rgba(34, 197, 94, 0.2)'
          : isInvalidDropTarget
            ? '0 0 12px rgba(239, 68, 68, 0.6)'
            : `0 0 10px ${getRarityGlowColor(item.rarity)}`,
    }),
    ...(!item && isValidDropTarget && {
      borderColor: '#22c55e',
      boxShadow: '0 0 12px rgba(34, 197, 94, 0.6), inset 0 0 8px rgba(34, 197, 94, 0.2)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
    }),
    ...(!item && isInvalidDropTarget && {
      borderColor: '#ef4444',
      boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
    }),
  };

  // Ghost style when this slot is being dragged from
  const ghostStyle: React.CSSProperties = isDragging ? {
    opacity: 0.3,
    transform: 'scale(0.95)',
  } : {};

  return (
    <div
      className={`
        inventory-slot relative aspect-square rounded-lg border-2 outline-none
        flex items-center justify-center
        ${item ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        ${item ? 'bg-neutral-900' : 'bg-neutral-900/30 border-neutral-800 border-dashed'}
        ${!item && !isValidDropTarget ? 'hover:border-neutral-700 hover:bg-neutral-900/50' : ''}
        group
      `}
      style={{ ...slotStyle, ...ghostStyle }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      aria-label={item ? `${item.name}, ${item.rarity} ${item.type}` : `Empty slot ${index + 1}`}
    >
      {item && (
        <>
          {/* Item Icon */}
          <div 
            className="text-3xl select-none pointer-events-none item-icon"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              transform: isPressed ? 'scale(0.9)' : 'scale(1)',
              transition: 'transform 0.1s ease-out',
            }}
          >
            {item.icon}
          </div>

          {/* Quantity Badge */}
          {item.quantity > 1 && (
            <div 
              className="quantity-badge absolute bottom-1 right-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full pointer-events-none"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                minWidth: '18px',
                textAlign: 'center',
              }}
            >
              {item.quantity}
            </div>
          )}

          {/* Rarity indicator glow for Epic+ */}
          {(item.rarity === Rarity.Epic || item.rarity === Rarity.Legendary) && (
            <div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${getRarityGlowColor(item.rarity)} 0%, transparent 70%)`,
                opacity: 0.3,
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
            />
          )}

          {/* Tooltip */}
          {showTooltip && !isDragging && (
            <div
              className={`
                absolute left-1/2 -translate-x-1/2 w-60
                bg-neutral-950/95 backdrop-blur-sm border border-neutral-700 rounded-lg p-3 z-50
                shadow-2xl pointer-events-none
                ${isBottomRow ? 'bottom-full mb-2' : 'top-full mt-2'}
              `}
              style={{
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              <ItemTooltipContent item={item} />
            </div>
          )}
        </>
      )}

      {/* Empty slot hint */}
      {!item && (
        <div className="text-neutral-700 text-xl opacity-50 pointer-events-none">
          +
        </div>
      )}
    </div>
  );
});

InventorySlot.displayName = 'InventorySlot';

// Equipment slot variant
interface EquipmentSlotProps {
  slot: EquipmentSlot;
  item: Item | null;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isSelected: boolean;
  isDragging: boolean;
  isValidDropTarget: boolean;
  onDragStart: (slot: EquipmentSlot, e: React.MouseEvent) => void;
  onDragEnd: () => void;
  onDrop: (slot: EquipmentSlot) => void;
  onHover: (slot: EquipmentSlot | null) => void;
  onClick: (slot: EquipmentSlot) => void;
  onRightClick: (slot: EquipmentSlot) => void;
}

export const EquipmentSlotComponent: React.FC<EquipmentSlotProps> = memo(({
  slot,
  item,
  icon: Icon,
  isSelected,
  isDragging,
  isValidDropTarget,
  onDragStart,
  onDragEnd,
  onDrop,
  onHover,
  onClick,
  onRightClick,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPressed(true);
    if (item) {
      SoundEffects.itemPickup();
      onDragStart(slot, e);
    }
  }, [item, slot, onDragStart]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    onDragEnd();
  }, [onDragEnd]);

  const handleMouseEnter = useCallback(() => {
    onHover(slot);
    if (item) {
      playHoverSound();
      tooltipTimeout.current = setTimeout(() => {
        setShowTooltip(true);
      }, 300);
    }
  }, [slot, item, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
    setShowTooltip(false);
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
  }, [onHover]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEffects.buttonClick();
    onClick(slot);
  }, [slot, onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRightClick(slot);
  }, [slot, onRightClick]);

  const slotStyle: React.CSSProperties = {
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isPressed ? 'scale(0.95)' : isSelected ? 'scale(1.05)' : 'scale(1)',
    ...(item && {
      borderColor: isSelected ? 'transparent' : getRarityBorderColor(item.rarity),
      boxShadow: isSelected
        ? `0 0 0 2px #e5e5e5, 0 0 20px ${getRarityGlowColor(item.rarity)}`
        : `0 0 10px ${getRarityGlowColor(item.rarity)}`,
    }),
    ...(isValidDropTarget && {
      borderColor: '#22c55e',
      boxShadow: '0 0 15px rgba(34, 197, 94, 0.7), inset 0 0 10px rgba(34, 197, 94, 0.3)',
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
    }),
  };

  const ghostStyle: React.CSSProperties = isDragging ? {
    opacity: 0.3,
    transform: 'scale(0.95)',
  } : {};

  return (
    <div
      className={`
        equipment-slot w-16 h-16 rounded-lg flex items-center justify-center relative
        ${item ? 'bg-neutral-800 border-2 cursor-grab active:cursor-grabbing' : 'bg-neutral-900/50 border border-neutral-800 border-dashed cursor-default'}
        ${!item && !isValidDropTarget ? 'hover:border-neutral-600 hover:bg-neutral-800/50' : ''}
        group
      `}
      style={{ ...slotStyle, ...ghostStyle }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      aria-label={item ? `${slot}: ${item.name}` : `${slot}: Empty`}
    >
      {item ? (
        <div 
          className="text-3xl select-none pointer-events-none item-icon"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            transform: isPressed ? 'scale(0.9)' : 'scale(1)',
            transition: 'transform 0.1s ease-out',
          }}
        >
          {item.icon}
        </div>
      ) : (
        <Icon className="text-neutral-700 pointer-events-none" size={24} />
      )}

      {/* Slot label */}
      <div className="absolute -bottom-5 text-[9px] text-neutral-500 uppercase font-mono tracking-tight pointer-events-none whitespace-nowrap">
        {slot.replace(/([A-Z])/g, ' $1').trim()}
      </div>

      {/* Tooltip */}
      {item && showTooltip && !isDragging && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-6 w-60
            bg-neutral-950/95 backdrop-blur-sm border border-neutral-700 rounded-lg p-3 z-50
            shadow-2xl pointer-events-none"
          style={{
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <ItemTooltipContent item={item} />
        </div>
      )}
    </div>
  );
});

EquipmentSlotComponent.displayName = 'EquipmentSlotComponent';
