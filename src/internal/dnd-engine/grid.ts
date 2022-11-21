// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridDefinition, Item, ItemId } from "./interfaces";
import { Rect, getItemRect } from "./utils";

export interface DndItem extends Item, Rect {
  originalX: number;
  originalY: number;
}

export class DndGrid {
  private _width: number;
  private _height: number;
  private _items = new Map<ItemId, DndItem>();
  private layout: Set<ItemId>[][] = [];

  constructor(gridDefinition: GridDefinition) {
    this._width = gridDefinition.width;
    this._height = 0;

    for (const item of gridDefinition.items) {
      this._items.set(item.id, { ...item, originalY: item.y, originalX: item.x, ...getItemRect(item) });

      if (item.x < 0 || item.y < 0 || item.x + item.width > this._width) {
        throw new Error("Invalid grid: items outside the boundaries.");
      }
      if (item.width < 1 || item.height < 1) {
        throw new Error("Invalid grid: items of invalid size.");
      }

      for (let y = item.y; y < item.y + item.height; y++) {
        while (this.layout.length <= y) {
          this.makeNewRow();
        }
        for (let x = item.x; x < item.x + item.width; x++) {
          this.layout[y][x].add(item.id);

          if (this.layout[y][x].size > 1) {
            throw new Error("Invalid grid: items overlap.");
          }
        }
      }
    }
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get items(): DndItem[] {
    return [...this._items.values()];
  }

  getItem(itemId: ItemId): DndItem {
    const item = this._items.get(itemId);
    if (!item) {
      throw new Error(`Item with id "${itemId}" not found in the grid.`);
    }
    return item;
  }

  getCell(x: number, y: number): DndItem[] {
    if (!this.layout[y] || !this.layout[y][x]) {
      return [];
    }
    return [...this.layout[y][x]].map((itemId) => this.getItem(itemId));
  }

  getCellOverlay(x: number, y: number, itemId: ItemId): null | DndItem {
    for (const item of this.getCell(x, y)) {
      if (item.id !== itemId) {
        return item;
      }
    }
    return null;
  }

  move(itemId: ItemId, x: number, y: number, onOverlap?: (overlapId: ItemId) => void): void {
    const moveTarget = this.getItem(itemId);

    this.removeLayoutItem(moveTarget);

    moveTarget.x = x;
    moveTarget.y = y;
    Object.assign(moveTarget, getItemRect(moveTarget));

    this.insertLayoutItem(moveTarget, onOverlap);
  }

  resize(itemId: ItemId, width: number, height: number, onOverlap?: (overlapId: ItemId) => void): void {
    const resizeTarget = this.getItem(itemId);

    this.removeLayoutItem(resizeTarget);

    resizeTarget.width = width;
    resizeTarget.height = height;
    Object.assign(resizeTarget, getItemRect(resizeTarget));

    this.insertLayoutItem(resizeTarget, onOverlap);
  }

  insert(item: Item, onOverlap: (overlapId: ItemId) => void): void {
    this._items.set(item.id, { ...item, originalY: item.y, originalX: item.x, ...getItemRect(item) });

    if (item.x < 0 || item.y < 0 || item.x + item.width > this._width) {
      throw new Error("Inserting item is outside the boundaries.");
    }
    if (item.width < 1 || item.height < 1) {
      throw new Error("Inserting item has invalid size.");
    }

    for (let y = item.y; y < item.y + item.height; y++) {
      while (this.layout.length <= y) {
        this.makeNewRow();
      }
      for (let x = item.x; x < item.x + item.width; x++) {
        for (const overlapId of this.layout[y][x]) {
          onOverlap(overlapId);
        }
        this.layout[y][x].add(item.id);
      }
    }
  }

  remove(itemId: ItemId): void {
    const removeTarget = this.getItem(itemId);
    this._items.delete(itemId);
    this.removeLayoutItem(removeTarget);
  }

  private removeLayoutItem(item: Item): void {
    for (let y = item.y; y < item.y + item.height; y++) {
      for (let x = item.x; x < item.x + item.width; x++) {
        this.layout[y][x].delete(item.id);
      }
    }
  }

  private insertLayoutItem(item: Item, onOverlap?: (overlapId: ItemId) => void): void {
    for (let y = item.y; y < item.y + item.height; y++) {
      for (let x = item.x; x < item.x + item.width; x++) {
        while (!this.layout[y]) {
          this.makeNewRow();
        }
        for (const overlapId of this.layout[y][x]) {
          onOverlap?.(overlapId);
        }
        this.layout[y][x].add(item.id);
      }
    }
  }

  private makeNewRow() {
    this.layout.push([...Array(this._width)].map(() => new Set()));
    this._height = this.layout.length;
  }
}
