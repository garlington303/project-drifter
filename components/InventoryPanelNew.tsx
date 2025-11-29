/**
 * InventoryPanel - Polished inventory UI with smooth drag-drop
 * Features: 60 FPS drag, visual feedback, GPU-accelerated animations
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { InventorySystem } from '../systems/InventorySystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { PlayerEntity } from '../entities/PlayerEntity';
import { EquipmentSlot, Item, Rarity } from '../utils/gameUtils';
import { 
  DragSource, 
  DragState, 
  createInitialDragState,
  canDropOnEquipmentSlot,
  getRarityBorderColor,
  getRarityGlowColor 
} from '../systems/DragDropSystem';
import { InventorySlot, EquipmentSlotComponent } from './InventorySlot';
import { SoundEffects } from '../utils/SoundEffects';
import { Shirt, Shield, Sword, Box, HardHat, Footprints, Crown, Hand } from 'lucide-react';

interface InventoryPanelProps {
  inventory: InventorySystem;
  equipment: EquipmentSystem;
  player: PlayerEntity;
  onUpdate: () => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ 
  inventory, 
  equipment, 
  player,
  onUpdate 
}) => {
  // Drag state
  const [dragState, setDragState] = useState<DragState>(createInitialDragState);
  const [selectedSlot, setSelectedSlot] = useState<{ type: 'inventory' | 'equipment'; index: number | EquipmentSlot } | null>(null);
  
  // For smooth dragging - use refs to avoid re-renders
  const dragRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // Animation state for panel entrance
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Panel entrance animation
    SoundEffects.inventoryOpen();
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => {
      clearTimeout(timer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // --- SMOOTH DRAG HANDLING ---
  
  // Update dragged item position with RAF for 60 FPS
  const updateDragPosition = useCallback(() => {
    if (dragRef.current && dragState.isDragging) {
      const x = mousePos.current.x - dragState.offsetX;
      const y = mousePos.current.y - dragState.offsetY;
      dragRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
    }
  }, [dragState.isDragging, dragState.offsetX, dragState.offsetY]);

  // Mouse move handler
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateDragPosition);
    };

    const handleMouseUp = () => {
      // Drop logic is handled by the slot components
      setDragState(prev => ({ ...prev, isDragging: false, draggedItem: null, dragSource: null }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cancel drag
        setDragState(createInitialDragState());
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dragState.isDragging, updateDragPosition]);

  // --- INVENTORY HANDLERS ---

  const handleInventoryDragStart = useCallback((index: number, e: React.MouseEvent) => {
    const item = inventory.items[index];
    if (!item) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragSource: { source: 'inventory', index },
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      validDropTarget: false,
      hoveredSlot: null,
    });
    mousePos.current = { x: e.clientX, y: e.clientY };
    setSelectedSlot({ type: 'inventory', index });
  }, [inventory.items]);

  const handleInventoryDrop = useCallback((targetIndex: number) => {
    if (!dragState.dragSource) return;

    if (dragState.dragSource.source === 'inventory') {
      if (dragState.dragSource.index !== targetIndex) {
        inventory.moveItem(dragState.dragSource.index, targetIndex);
        setSelectedSlot({ type: 'inventory', index: targetIndex });
        onUpdate();
      }
    } else if (dragState.dragSource.source === 'equipment') {
      const equipSlot = dragState.dragSource.slot;
      const equippedItem = equipment.slots[equipSlot];
      const targetItem = inventory.items[targetIndex];

      if (!equippedItem) return;

      if (!targetItem) {
        // Move equipped item to empty inventory slot
        equipment.unequip(equipSlot);
        inventory.items[targetIndex] = equippedItem;
        SoundEffects.itemUnequip();
        setSelectedSlot({ type: 'inventory', index: targetIndex });
        onUpdate();
      } else if (targetItem.slot === equipSlot) {
        // Swap items
        equipment.unequip(equipSlot);
        equipment.equip(targetItem, equipSlot);
        inventory.items[targetIndex] = equippedItem;
        SoundEffects.itemEquip();
        setSelectedSlot({ type: 'inventory', index: targetIndex });
        onUpdate();
      }
    }

    setDragState(createInitialDragState());
  }, [dragState.dragSource, inventory, equipment, onUpdate]);

  const handleInventoryRightClick = useCallback((index: number) => {
    const item = inventory.items[index];
    if (item && item.slot) {
      const unequippedItem = equipment.equip(item, item.slot);
      inventory.removeItem(index);
      if (unequippedItem) {
        inventory.items[index] = unequippedItem;
      }
      SoundEffects.itemEquip();
      onUpdate();
    }
  }, [inventory, equipment, onUpdate]);

  const handleInventoryClick = useCallback((index: number) => {
    setSelectedSlot({ type: 'inventory', index });
  }, []);

  const handleInventoryHover = useCallback((index: number | null) => {
    if (dragState.isDragging && index !== null) {
      setDragState(prev => ({
        ...prev,
        hoveredSlot: { type: 'inventory', index },
        validDropTarget: true, // Inventory slots always accept drops
      }));
    }
  }, [dragState.isDragging]);

  // --- EQUIPMENT HANDLERS ---

  const handleEquipmentDragStart = useCallback((slot: EquipmentSlot, e: React.MouseEvent) => {
    const item = equipment.slots[slot];
    if (!item) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    setDragState({
      isDragging: true,
      draggedItem: item,
      dragSource: { source: 'equipment', slot },
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      validDropTarget: false,
      hoveredSlot: null,
    });
    mousePos.current = { x: e.clientX, y: e.clientY };
    setSelectedSlot({ type: 'equipment', index: slot });
  }, [equipment.slots]);

  const handleEquipmentDrop = useCallback((targetSlot: EquipmentSlot) => {
    if (!dragState.dragSource || dragState.dragSource.source !== 'inventory') return;

    const item = inventory.items[dragState.dragSource.index];
    if (item && item.slot === targetSlot) {
      const unequipped = equipment.equip(item, targetSlot);
      inventory.removeItem(dragState.dragSource.index);
      if (unequipped) {
        inventory.items[dragState.dragSource.index] = unequipped;
      }
      SoundEffects.itemEquip();
      setSelectedSlot({ type: 'equipment', index: targetSlot });
      onUpdate();
    }

    setDragState(createInitialDragState());
  }, [dragState.dragSource, inventory, equipment, onUpdate]);

  const handleEquipmentRightClick = useCallback((slot: EquipmentSlot) => {
    const item = equipment.slots[slot];
    if (!item) return;

    const unequippedItem = equipment.unequip(slot);
    if (unequippedItem) {
      const added = inventory.addItem(unequippedItem);
      if (!added) {
        equipment.equip(unequippedItem, slot);
        SoundEffects.invalidAction();
        console.warn("Cannot unequip: Inventory is full.");
      } else {
        SoundEffects.itemUnequip();
        onUpdate();
      }
    }
  }, [equipment, inventory, onUpdate]);

  const handleEquipmentClick = useCallback((slot: EquipmentSlot) => {
    setSelectedSlot({ type: 'equipment', index: slot });
  }, []);

  const handleEquipmentHover = useCallback((slot: EquipmentSlot | null) => {
    if (dragState.isDragging && slot !== null && dragState.draggedItem) {
      const isValid = canDropOnEquipmentSlot(dragState.draggedItem, slot);
      setDragState(prev => ({
        ...prev,
        hoveredSlot: { type: 'equipment', index: slot },
        validDropTarget: isValid,
      }));
    }
  }, [dragState.isDragging, dragState.draggedItem]);

  const handleDragEnd = useCallback(() => {
    setDragState(createInitialDragState());
  }, []);

  // Clear selection when clicking panel background
  const handlePanelClick = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  // --- COMPUTED VALUES ---

  const usedSlots = useMemo(() => 
    inventory.items.filter(i => i !== null).length,
    [inventory.items]
  );

  // Check if a slot is the current drag source
  const isSlotDragging = useCallback((type: 'inventory' | 'equipment', index: number | EquipmentSlot) => {
    if (!dragState.dragSource) return false;
    if (type === 'inventory' && dragState.dragSource.source === 'inventory') {
      return dragState.dragSource.index === index;
    }
    if (type === 'equipment' && dragState.dragSource.source === 'equipment') {
      return dragState.dragSource.slot === index;
    }
    return false;
  }, [dragState.dragSource]);

  // Check if a slot is a valid drop target
  const isValidDropTarget = useCallback((type: 'inventory' | 'equipment', index: number | EquipmentSlot) => {
    if (!dragState.isDragging || !dragState.hoveredSlot) return false;
    if (dragState.hoveredSlot.type !== type) return false;
    if (dragState.hoveredSlot.index !== index) return false;
    return dragState.validDropTarget;
  }, [dragState.isDragging, dragState.hoveredSlot, dragState.validDropTarget]);

  // Check if hovering over invalid slot
  const isInvalidDropTarget = useCallback((type: 'inventory' | 'equipment', index: number | EquipmentSlot) => {
    if (!dragState.isDragging || !dragState.hoveredSlot) return false;
    if (dragState.hoveredSlot.type !== type) return false;
    if (dragState.hoveredSlot.index !== index) return false;
    return !dragState.validDropTarget;
  }, [dragState.isDragging, dragState.hoveredSlot, dragState.validDropTarget]);

  // Equipment slot config
  const equipmentSlots: { slot: EquipmentSlot; icon: any; gridArea: string }[] = [
    { slot: EquipmentSlot.Head, icon: HardHat, gridArea: '1 / 2' },
    { slot: EquipmentSlot.MainHand, icon: Sword, gridArea: '2 / 1' },
    { slot: EquipmentSlot.Chest, icon: Shirt, gridArea: '2 / 2' },
    { slot: EquipmentSlot.OffHand, icon: Shield, gridArea: '2 / 3' },
    { slot: EquipmentSlot.Gloves, icon: Hand, gridArea: '3 / 1' },
    { slot: EquipmentSlot.Legs, icon: Box, gridArea: '3 / 2' },
    { slot: EquipmentSlot.Accessory, icon: Crown, gridArea: '3 / 3' },
    { slot: EquipmentSlot.Boots, icon: Footprints, gridArea: '4 / 2' },
  ];

  return (
    <div 
      className="flex h-full gap-6 select-none"
      onClick={handlePanelClick}
      style={{
        animation: isAnimating ? 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
      }}
    >
      {/* LEFT COLUMN: EQUIPMENT */}
      <div 
        className="w-1/3 flex flex-col items-center bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-xl p-4 relative overflow-visible"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: isAnimating ? 'fadeIn 0.3s ease-out' : undefined,
        }}
      >
        <h3 className="text-neutral-300 font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Equipment
        </h3>

        {/* Character silhouette background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
          <div className="w-48 h-80 bg-gradient-to-b from-neutral-400 to-transparent rounded-full blur-2xl" />
        </div>

        {/* Equipment Grid */}
        <div className="relative z-10 grid grid-cols-3 gap-x-4 gap-y-8 mt-2">
          {equipmentSlots.map(({ slot, icon, gridArea }, i) => (
            <div key={slot} style={{ gridArea }} className="flex justify-center">
              <EquipmentSlotComponent
                slot={slot}
                item={equipment.slots[slot]}
                icon={icon}
                isSelected={selectedSlot?.type === 'equipment' && selectedSlot.index === slot}
                isDragging={isSlotDragging('equipment', slot)}
                isValidDropTarget={isValidDropTarget('equipment', slot)}
                onDragStart={handleEquipmentDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleEquipmentDrop}
                onHover={handleEquipmentHover}
                onClick={handleEquipmentClick}
                onRightClick={handleEquipmentRightClick}
              />
            </div>
          ))}
        </div>

        {/* Help text */}
        <div className="mt-auto text-xs text-neutral-500 text-center w-full pt-4 border-t border-neutral-800">
          <span className="text-neutral-400">Right-click</span> to Equip/Unequip
        </div>
      </div>

      {/* RIGHT COLUMN: INVENTORY GRID */}
      <div 
        className="w-2/3 flex flex-col h-full bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-xl relative overflow-visible"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: isAnimating ? 'fadeIn 0.3s ease-out 0.1s both' : undefined,
        }}
      >
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 bg-neutral-900/80 flex justify-between items-center rounded-t-xl">
          <span className="text-neutral-200 font-bold text-sm flex items-center gap-2">
            <span className="text-lg">🎒</span>
            BACKPACK
          </span>
          <span className="text-neutral-400 text-xs font-mono bg-neutral-800 px-2 py-1 rounded">
            {usedSlots}/{inventory.items.length}
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 p-4 overflow-visible">
          <div className="grid grid-cols-5 gap-3">
            {inventory.items.map((item, index) => (
              <InventorySlot
                key={index}
                item={item}
                index={index}
                isSelected={selectedSlot?.type === 'inventory' && selectedSlot.index === index}
                isDragging={isSlotDragging('inventory', index)}
                isValidDropTarget={isValidDropTarget('inventory', index)}
                isInvalidDropTarget={isInvalidDropTarget('inventory', index)}
                onDragStart={handleInventoryDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleInventoryDrop}
                onHover={handleInventoryHover}
                onClick={handleInventoryClick}
                onRightClick={handleInventoryRightClick}
                animationDelay={isAnimating ? index * 20 : 0}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-950/80 border-t border-neutral-800 p-2 px-4 flex justify-between items-center text-xs font-mono rounded-b-xl">
          <div className="text-neutral-400">
            GOLD: <span className="text-amber-400 font-bold">{inventory.gold.toLocaleString()}</span>
          </div>
          <div className="text-neutral-600">
            Drag to move • Right-click to equip
          </div>
        </div>
      </div>

      {/* FLOATING DRAGGED ITEM */}
      {dragState.isDragging && dragState.draggedItem && (
        <div
          ref={dragRef}
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: 0,
            top: 0,
            transform: `translate(${mousePos.current.x - dragState.offsetX}px, ${mousePos.current.y - dragState.offsetY}px) scale(1.1)`,
            willChange: 'transform',
          }}
        >
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(23, 23, 23, 0.95)',
              border: `2px solid ${getRarityBorderColor(dragState.draggedItem.rarity)}`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${getRarityGlowColor(dragState.draggedItem.rarity)}`,
            }}
          >
            <span className="text-3xl select-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
              {dragState.draggedItem.icon}
            </span>
            {dragState.draggedItem.quantity > 1 && (
              <div 
                className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-white px-1 rounded-full"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {dragState.draggedItem.quantity}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Animations - injected as style tag */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        @keyframes pop-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .inventory-slot {
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .inventory-slot:hover {
          filter: brightness(1.15);
        }

        .equipment-slot {
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .equipment-slot:hover {
          filter: brightness(1.15);
        }

        .quantity-badge {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};
