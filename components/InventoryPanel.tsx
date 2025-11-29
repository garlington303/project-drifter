
import React, { useState } from 'react';
import { InventorySystem } from '../systems/InventorySystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { PlayerEntity } from '../entities/PlayerEntity';
import { EquipmentSlot, Rarity } from '../utils/gameUtils';
import { Shirt, Shield, Sword, Box, HardHat, Footprints, Crown, Hand } from 'lucide-react';

interface InventoryPanelProps {
  inventory: InventorySystem;
  equipment: EquipmentSystem;
  player: PlayerEntity; 
  onUpdate: () => void;
}

type DragSource = 
  | { source: 'inventory'; index: number }
  | { source: 'equipment'; slot: EquipmentSlot };

type DropTarget = 
  | { type: 'inventory'; index: number }
  | { type: 'equipment'; slot: EquipmentSlot };

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, equipment, onUpdate }) => {
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ type: 'inventory' | 'equipment', index: number | string } | null>(null);
  const [hoverTarget, setHoverTarget] = useState<DropTarget | null>(null);

  // --- HELPER: GET DROP FEEDBACK COLOR ---
  const getDragFeedbackClass = (targetType: 'inventory' | 'equipment', targetIndex: number | string) => {
    if (!dragSource) return '';
    
    // Check if this specific slot is being hovered
    let isHovered = false;
    if (hoverTarget && hoverTarget.type === targetType) {
        if (hoverTarget.type === 'inventory') {
            isHovered = hoverTarget.index === targetIndex;
        } else {
            isHovered = hoverTarget.slot === targetIndex;
        }
    }

    if (!isHovered) return '';

    // 1. Inventory -> Inventory (Always Valid - Swap/Move)
    if (targetType === 'inventory') {
        return 'bg-blue-900/40 ring-2 ring-blue-500 scale-[1.02]';
    }

    // 2. Dragging TO Equipment Slot
    if (targetType === 'equipment') {
        let itemToEquip = null;

        // Find the item being dragged
        if (dragSource.source === 'inventory') {
            itemToEquip = inventory.items[dragSource.index];
        } else {
            // Equipment -> Equipment (usually distinct slots, unlikely to be valid unless we add logic later)
            // For now, assume invalid unless same slot (which is no-op)
            return 'bg-red-900/40 ring-2 ring-red-500';
        }

        // Check compatibility
        if (itemToEquip && itemToEquip.slot === targetIndex) {
             return 'bg-emerald-900/40 ring-2 ring-emerald-500 scale-[1.05] shadow-[0_0_15px_rgba(16,185,129,0.5)]';
        } else {
             return 'bg-red-900/40 ring-2 ring-red-500 scale-[0.98]';
        }
    }

    return '';
  };

  // --- DRAG HANDLERS ---

  const handleDragStart = (e: React.DragEvent, source: DragSource) => {
    setDragSource(source);
    if (source.source === 'inventory') setSelectedSlot({ type: 'inventory', index: source.index });
    else setSelectedSlot({ type: 'equipment', index: source.slot });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/project-drifter-item', JSON.stringify(source));
    
    // Custom drag image logic
    const target = e.currentTarget as HTMLElement;
    const iconElement = target.querySelector('.item-icon');
    if (iconElement) {
       const rect = iconElement.getBoundingClientRect();
       e.dataTransfer.setDragImage(iconElement, rect.width / 2, rect.height / 2);
    }
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setHoverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    setHoverTarget(target);
  };

  // --- DROP HANDLERS ---

  const handleDropOnInventory = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setHoverTarget(null);
    
    if (!dragSource) return;

    if (dragSource.source === 'inventory') {
        if (dragSource.index !== targetIndex) {
            inventory.moveItem(dragSource.index, targetIndex);
            setSelectedSlot({ type: 'inventory', index: targetIndex });
            onUpdate();
        }
    } 
    else if (dragSource.source === 'equipment') {
        const equipSlot = dragSource.slot;
        const equippedItem = equipment.slots[equipSlot];
        const targetItem = inventory.items[targetIndex];

        if (!equippedItem) return;

        if (!targetItem) {
            equipment.unequip(equipSlot);
            inventory.items[targetIndex] = equippedItem;
            setSelectedSlot({ type: 'inventory', index: targetIndex });
            onUpdate();
        } 
        else {
            if (targetItem.slot === equipSlot) {
                equipment.unequip(equipSlot);
                equipment.equip(targetItem, equipSlot);
                inventory.items[targetIndex] = equippedItem;
                setSelectedSlot({ type: 'inventory', index: targetIndex });
                onUpdate();
            }
        }
    }
  };

  const handleDropOnEquipment = (e: React.DragEvent, targetSlot: EquipmentSlot) => {
    e.preventDefault();
    e.stopPropagation();
    setHoverTarget(null);

    if (!dragSource) return;

    if (dragSource.source === 'inventory') {
        const item = inventory.items[dragSource.index];
        if (item && item.slot === targetSlot) {
            const unequipped = equipment.equip(item, targetSlot);
            inventory.removeItem(dragSource.index);
            if (unequipped) {
                inventory.items[dragSource.index] = unequipped;
            }
            setSelectedSlot({ type: 'equipment', index: targetSlot });
            onUpdate();
        }
    } 
  };

  // --- CLICK HANDLERS ---

  const handleSlotClick = (e: React.MouseEvent, type: 'inventory' | 'equipment', index: number | string) => {
    e.stopPropagation();
    setSelectedSlot({ type, index });
  };

  const handleInventoryRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const item = inventory.items[index];
    if (item && item.slot) {
        const unequippedItem = equipment.equip(item, item.slot);
        inventory.removeItem(index);
        if (unequippedItem) {
            inventory.items[index] = unequippedItem;
        }
        onUpdate();
    }
  };

  const handleEquipRightClick = (e: React.MouseEvent, slot: EquipmentSlot) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = equipment.slots[slot];
    if (!item) return;

    const unequippedItem = equipment.unequip(slot);
    if (unequippedItem) {
        const added = inventory.addItem(unequippedItem);
        if (!added) {
            equipment.equip(unequippedItem, slot);
            console.warn("Cannot unequip: Inventory is full.");
        }
        onUpdate();
    }
  };

  // --- RENDERING HELPERS ---

  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.Common: return 'border-neutral-700';
      case Rarity.Uncommon: return 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      case Rarity.Rare: return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      case Rarity.Epic: return 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
      case Rarity.Legendary: return 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
      default: return 'border-neutral-700';
    }
  };

  const RenderEquipSlot = ({ slot, icon: Icon }: { slot: EquipmentSlot, icon: any }) => {
    const item = equipment.slots[slot];
    const isSelected = selectedSlot?.type === 'equipment' && selectedSlot?.index === slot;
    const feedbackClass = getDragFeedbackClass('equipment', slot);

    return (
      <div 
        className={`
            w-16 h-16 rounded flex items-center justify-center relative transition-all duration-150 outline-none
            ${item ? 'bg-neutral-800' : 'bg-neutral-900/50'}
            ${item ? getRarityColor(item.rarity) : 'border border-neutral-800'}
            
            /* Selection Highlight */
            ${isSelected ? 'ring-2 ring-neutral-200 z-10 border-transparent' : ''}
            
            /* Feedback Highlight (Overrides Selection/Border) */
            ${feedbackClass}

            ${item ? 'cursor-grab active:cursor-grabbing hover:bg-neutral-700' : 'cursor-default'}
        `}
        draggable={!!item}
        onDragStart={(e) => handleDragStart(e, { source: 'equipment', slot })}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, { type: 'equipment', slot })}
        onDrop={(e) => handleDropOnEquipment(e, slot)}
        onClick={(e) => handleSlotClick(e, 'equipment', slot)}
        onContextMenu={(e) => handleEquipRightClick(e, slot)}
      >
        {item ? (
           <div className="text-3xl select-none pointer-events-none item-icon">{item.icon}</div>
        ) : (
           <Icon className={`pointer-events-none transition-colors duration-200 ${feedbackClass ? 'text-neutral-500' : 'text-neutral-700'}`} size={24} />
        )}
        <div className="absolute -bottom-5 text-[10px] text-neutral-500 uppercase font-mono tracking-tighter pointer-events-none">{slot}</div>
        
        {/* Tooltip */}
        {item && (
            <div className={`
                absolute left-1/2 -translate-x-1/2 mt-2 top-full w-56 
                bg-neutral-950 border border-neutral-800 rounded-lg p-3 z-50 
                shadow-2xl pointer-events-none opacity-0 transition-opacity duration-150
                ${isSelected ? 'opacity-100' : 'group-hover:opacity-100'}
            `}>
                <ItemTooltipContent item={item} />
            </div>
        )}
      </div>
    );
  };

  const ItemTooltipContent = ({ item }: { item: any }) => (
    <>
        <div className="flex justify-between items-start mb-1">
            <span className={`font-bold text-sm ${
                item.rarity === Rarity.Legendary ? 'text-amber-400' :
                item.rarity === Rarity.Epic ? 'text-purple-400' :
                item.rarity === Rarity.Rare ? 'text-blue-400' :
                item.rarity === Rarity.Uncommon ? 'text-emerald-400' : 'text-neutral-200'
            }`}>
                {item.name}
            </span>
            {item.slot && <span className="text-[10px] bg-neutral-800 px-1 rounded text-neutral-400">{item.slot}</span>}
        </div>
        
        <div className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2 border-b border-neutral-800 pb-1">{item.type} • {item.rarity}</div>
        <div className="text-xs text-neutral-400 leading-relaxed italic mb-2">"{item.description}"</div>
        
        {item.stats && (
            <div className="space-y-1">
            {item.stats.attack && <div className="text-xs text-emerald-400 flex justify-between"><span>Attack Power</span> <span>+{item.stats.attack}</span></div>}
            {item.stats.defense && <div className="text-xs text-blue-400 flex justify-between"><span>Defense</span> <span>+{item.stats.defense}</span></div>}
            {item.stats.speed && <div className="text-xs text-amber-400 flex justify-between"><span>Speed</span> <span>+{item.stats.speed}</span></div>}
            {item.stats.health && <div className="text-xs text-red-400 flex justify-between"><span>Max HP</span> <span>+{item.stats.health}</span></div>}
            </div>
        )}
    </>
  );

  const usedSlots = inventory.items.filter(i => i !== null).length;

  return (
    <div className="flex h-full gap-6 select-none" onClick={() => setSelectedSlot(null)}>
      
      {/* LEFT COLUMN: EQUIPMENT */}
      <div className="w-1/3 flex flex-col items-center bg-neutral-900/30 border border-neutral-800 rounded-lg p-4 relative" onClick={(e) => e.stopPropagation()}>
         <h3 className="text-neutral-400 font-bold text-sm uppercase tracking-wider mb-6">Equipment</h3>
         
         <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
             <div className="w-48 h-80 bg-neutral-500 rounded-full blur-2xl"></div>
         </div>

         <div className="relative z-10 grid grid-cols-3 gap-x-4 gap-y-8 mt-2 group">
             <div className="col-start-2 flex justify-center"><RenderEquipSlot slot={EquipmentSlot.Head} icon={HardHat} /></div>
             
             <div className="col-start-1 flex justify-center"><RenderEquipSlot slot={EquipmentSlot.MainHand} icon={Sword} /></div>
             <div className="col-start-2 flex justify-center"><RenderEquipSlot slot={EquipmentSlot.Chest} icon={Shirt} /></div>
             <div className="col-start-3 flex justify-center"><RenderEquipSlot slot={EquipmentSlot.OffHand} icon={Shield} /></div>

             <div className="col-start-1 flex justify-center"><RenderEquipSlot slot={EquipmentSlot.Gloves} icon={Hand} /></div>
             <div className="col-start-2 flex justify-center"><RenderEquipSlot slot={EquipmentSlot.Legs} icon={Box} /></div>
             <div className="col-start-3 flex justify-center"><RenderEquipSlot slot={EquipmentSlot.Accessory} icon={Crown} /></div>

             <div className="col-start-2 flex justify-center"><RenderEquipSlot slot={EquipmentSlot.Boots} icon={Footprints} /></div>
         </div>

         <div className="mt-auto text-xs text-neutral-500 text-center w-full pt-4 border-t border-neutral-800">
            Right-click to Equip/Unequip
         </div>
      </div>


      {/* RIGHT COLUMN: INVENTORY GRID */}
      <div className="w-2/3 flex flex-col h-full bg-neutral-900/30 border border-neutral-800 rounded-lg relative" onClick={(e) => e.stopPropagation()}>
          <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center rounded-t-lg">
              <span className="text-neutral-300 font-bold text-sm">BACKPACK</span>
              <span className="text-neutral-500 text-xs font-mono">{usedSlots}/{inventory.items.length}</span>
          </div>

          <div className="flex-1 p-4">
            <div className="grid grid-cols-5 gap-3">
                {inventory.items.map((item, index) => {
                    const isSelected = selectedSlot?.type === 'inventory' && selectedSlot?.index === index;
                    const isDraggingThis = dragSource?.source === 'inventory' && dragSource.index === index;
                    const feedbackClass = getDragFeedbackClass('inventory', index);
                    
                    const row = Math.floor(index / 5);
                    const isBottomRow = row >= 3;

                    return (
                        <div
                            key={index}
                            className={`
                            relative aspect-square rounded border-2 outline-none transition-all duration-150
                            flex items-center justify-center
                            ${item ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
                            ${isDraggingThis ? 'opacity-30' : 'opacity-100'}
                            
                            /* Base Style */
                            ${item ? 'bg-neutral-900' : 'bg-neutral-900/30 border-neutral-800'}
                            
                            /* Border Color - Neutral by default to avoid confusion with selection */
                            ${item && !isSelected ? 'border-neutral-800' : ''} 
                            
                            /* Hover Effect */
                            hover:bg-neutral-800 hover:scale-[1.02] hover:border-neutral-700
                            
                            /* Selection Highlight */
                            ${isSelected ? 'ring-2 ring-neutral-200 z-10 border-transparent bg-neutral-800' : ''}
                            
                            /* Drag Feedback */
                            ${feedbackClass}

                            group
                            `}
                            draggable={!!item}
                            onDragStart={(e) => handleDragStart(e, { source: 'inventory', index })}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, { type: 'inventory', index })}
                            onDrop={(e) => handleDropOnInventory(e, index)}
                            onClick={(e) => handleSlotClick(e, 'inventory', index)}
                            onContextMenu={(e) => handleInventoryRightClick(e, index)}
                        >
                            {item && (
                            <>
                                <div className="text-3xl select-none drop-shadow-lg pointer-events-none item-icon filter">{item.icon}</div>
                                {item.quantity > 1 && (
                                <div className="absolute bottom-1 right-1 text-[10px] font-bold text-neutral-300 bg-neutral-950/80 px-1.5 py-0.5 rounded-full border border-neutral-800 pointer-events-none">
                                    {item.quantity}
                                </div>
                                )}
                                
                                {/* Tooltip */}
                                <div className={`
                                    absolute left-1/2 -translate-x-1/2 w-56 
                                    bg-neutral-950 border border-neutral-800 rounded-lg p-3 z-50 
                                    shadow-2xl pointer-events-none opacity-0 transition-opacity duration-150
                                    ${isBottomRow ? 'bottom-full mb-2' : 'top-full mt-2'}
                                    ${isSelected ? 'opacity-100' : 'group-hover:opacity-100'}
                                `}>
                                    <ItemTooltipContent item={item} />
                                </div>
                            </>
                            )}
                        </div>
                    );
                })}
            </div>
          </div>

          <div className="bg-neutral-950 border-t border-neutral-800 p-2 px-4 flex justify-between items-center text-xs font-mono text-neutral-500 rounded-b-lg">
             <div>GOLD: <span className="text-amber-500">{inventory.gold}</span></div>
          </div>
      </div>
    </div>
  );
};
