/**
 * DragDropSystem - Manages smooth drag-drop state for inventory
 * Uses pure CSS transforms for 60 FPS performance
 */

import { Item, EquipmentSlot } from '../utils/gameUtils';

export type DragSource = 
  | { source: 'inventory'; index: number }
  | { source: 'equipment'; slot: EquipmentSlot };

export interface DragState {
  isDragging: boolean;
  draggedItem: Item | null;
  dragSource: DragSource | null;
  mouseX: number;
  mouseY: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  validDropTarget: boolean;
  hoveredSlot: { type: 'inventory' | 'equipment'; index: number | EquipmentSlot } | null;
}

export const createInitialDragState = (): DragState => ({
  isDragging: false,
  draggedItem: null,
  dragSource: null,
  mouseX: 0,
  mouseY: 0,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  validDropTarget: false,
  hoveredSlot: null,
});

/**
 * Check if an item can be dropped on a specific equipment slot
 */
export const canDropOnEquipmentSlot = (item: Item | null, targetSlot: EquipmentSlot): boolean => {
  if (!item) return false;
  return item.slot === targetSlot;
};

/**
 * Check if an item can be dropped on an inventory slot
 */
export const canDropOnInventorySlot = (
  dragSource: DragSource | null, 
  targetIndex: number
): boolean => {
  if (!dragSource) return false;
  // Can always drop on inventory slots (swap or place)
  return true;
};

/**
 * Throttle function for mousemove events (60 FPS cap)
 */
export const createThrottledMouseHandler = (
  callback: (x: number, y: number) => void,
  fps: number = 60
) => {
  let lastCall = 0;
  const minInterval = 1000 / fps;
  let rafId: number | null = null;

  return (e: MouseEvent) => {
    const now = performance.now();
    
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    if (now - lastCall >= minInterval) {
      lastCall = now;
      callback(e.clientX, e.clientY);
    } else {
      rafId = requestAnimationFrame(() => {
        lastCall = performance.now();
        callback(e.clientX, e.clientY);
        rafId = null;
      });
    }
  };
};

/**
 * Rarity color utilities for glow effects
 */
export const getRarityGlowColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return 'rgba(251, 191, 36, 0.6)';
    case 'epic': return 'rgba(168, 85, 247, 0.5)';
    case 'rare': return 'rgba(59, 130, 246, 0.4)';
    case 'uncommon': return 'rgba(16, 185, 129, 0.3)';
    default: return 'rgba(100, 100, 100, 0.2)';
  }
};

export const getRarityBorderColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return '#fbbf24';
    case 'epic': return '#a855f7';
    case 'rare': return '#3b82f6';
    case 'uncommon': return '#10b981';
    default: return '#525252';
  }
};
