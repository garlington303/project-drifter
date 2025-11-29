/**
 * SoundEffects - Placeholder hooks for future audio implementation
 * Call these at appropriate moments in UI code for consistent sound design
 */

// Sound effect placeholders - implement with Web Audio API or Howler.js later
export const SoundEffects = {
  /** Short "pop" sound when picking up an item */
  itemPickup: () => {
    // TODO: Play pickup sound
  },

  /** Soft "thud" when dropping an item */
  itemDrop: () => {
    // TODO: Play drop sound
  },

  /** Metallic "clink" when equipping gear */
  itemEquip: () => {
    // TODO: Play equip sound
  },

  /** Unequip sound - softer clink */
  itemUnequip: () => {
    // TODO: Play unequip sound
  },

  /** Potion "glug" or consumable use sound */
  itemUse: () => {
    // TODO: Play use sound
  },

  /** UI "whoosh" when opening inventory */
  inventoryOpen: () => {
    // TODO: Play open sound
  },

  /** UI "swoosh" when closing inventory */
  inventoryClose: () => {
    // TODO: Play close sound
  },

  /** Subtle continuous drag sound */
  itemDrag: () => {
    // TODO: Play drag sound
  },

  /** Error "buzz" for invalid actions */
  invalidAction: () => {
    // TODO: Play error sound
  },

  /** Very subtle hover tick */
  hover: () => {
    // TODO: Play hover sound (debounced)
  },

  /** Stack split sound */
  stackSplit: () => {
    // TODO: Play split sound
  },

  /** Gold pickup jingle */
  goldPickup: () => {
    // TODO: Play gold sound
  },

  /** Button click */
  buttonClick: () => {
    // TODO: Play button click
  },

  /** Tab switch */
  tabSwitch: () => {
    // TODO: Play tab switch
  }
};

// Debounced hover sound to prevent spam
let lastHoverSound = 0;
const HOVER_DEBOUNCE_MS = 100;

export const playHoverSound = () => {
  const now = Date.now();
  if (now - lastHoverSound > HOVER_DEBOUNCE_MS) {
    lastHoverSound = now;
    SoundEffects.hover();
  }
};
