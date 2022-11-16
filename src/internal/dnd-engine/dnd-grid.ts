// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CommittedMove, GridDefinition, Item, ItemId } from "./interfaces";

export interface DndItem extends Item, Rect {
  committed: boolean;
  originalX: number;
  originalY: number;
}

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type Direction = "top" | "right" | "bottom" | "left";

export class DndGrid {
  width: number;
  items: readonly Item[];

  dndItems = new Map<ItemId, DndItem>();
  layout: Set<ItemId>[][] = [];
  moves: CommittedMove[] = [];
  conflicts: ItemId[] = [];
  blocks = new Set<ItemId>();

  constructor(gridDefinition: GridDefinition, targetId?: ItemId) {
    this.width = gridDefinition.width;
    this.items = gridDefinition.items;

    for (const item of gridDefinition.items) {
      this.dndItems.set(item.id, {
        ...item,
        originalY: item.y,
        originalX: item.x,
        committed: item.id === targetId ? true : false,
        ...getItemRect(item),
      });

      for (let y = item.y; y < item.y + item.height; y++) {
        while (this.layout.length <= y) {
          this.layout.push([...Array(this.width)].map(() => new Set()));
        }

        for (let x = item.x; x < item.x + item.width; x++) {
          this.layout[y][x].add(item.id);
        }
      }
    }
  }

  getItem = (itemId: ItemId): DndItem => {
    const item = this.dndItems.get(itemId);
    if (!item) {
      throw new Error(`Item with id "${itemId}" not found in the grid.`);
    }

    // Update rect properties if position changed.
    Object.assign(item, getItemRect(item));

    return item;
  };

  getLayoutCell = (x: number, y: number): DndItem[] => {
    if (!this.layout[y] || !this.layout[y][x]) {
      return [];
    }
    return [...this.layout[y][x]].map(this.getItem);
  };

  getLayoutConflict = (x: number, y: number, itemId: ItemId): null | DndItem => {
    for (const item of this.getLayoutCell(x, y)) {
      if (item.id !== itemId) {
        return item;
      }
    }
    return null;
  };

  removeLayoutItem = (item: Item): void => {
    for (let y = item.y; y < item.y + item.height; y++) {
      for (let x = item.x; x < item.x + item.width; x++) {
        this.layout[y][x].delete(item.id);
      }
    }
  };

  insertLayoutItem = (item: Item): void => {
    for (let y = item.y; y < item.y + item.height; y++) {
      for (let x = item.x; x < item.x + item.width; x++) {
        while (!this.layout[y]) {
          this.layout.push([...Array(this.width)].map(() => new Set()));
        }
        this.layout[y][x].add(item.id);
      }
    }
  };
}

function getItemRect(item: Item): Rect {
  return {
    left: item.x,
    right: item.x + item.width - 1,
    top: item.y,
    bottom: item.y + item.height - 1,
  };
}
