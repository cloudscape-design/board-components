// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem, ItemId } from "../interfaces";
import { Rect, getItemRect } from "./utils";

export interface LayoutEngineItem extends GridLayoutItem, Rect {}

export class ReadonlyLayoutEngineGrid {
  protected _width: number;
  protected _height: number;
  protected _items = new Map<ItemId, LayoutEngineItem>();
  protected _layout: Set<ItemId>[][] = [];

  static clone(grid: ReadonlyLayoutEngineGrid): LayoutEngineGrid {
    const clone = new LayoutEngineGrid([], 0);
    clone._width = grid._width;
    clone._height = grid._height;
    for (const [key, value] of grid._items) {
      clone._items.set(key, { ...value });
    }
    for (let y = 0; y < clone._height; y++) {
      const row = new Array<Set<ItemId>>();
      for (let x = 0; x < clone._width; x++) {
        const cellItems = new Set(grid._layout[y][x]);
        row.push(cellItems);
      }
      clone._layout.push(row);
    }
    return clone;
  }

  constructor(items: readonly GridLayoutItem[], columns: number) {
    this._width = columns;
    this._height = 0;

    for (const item of items) {
      this._items.set(item.id, { ...item, ...getItemRect(item) });

      if (item.x < 0 || item.y < 0 || item.x + item.width > this._width) {
        throw new Error("Invalid grid: items outside the boundaries.");
      }
      if (item.width < 1 || item.height < 1) {
        throw new Error("Invalid grid: items of invalid size.");
      }

      for (let y = item.y; y < item.y + item.height; y++) {
        while (this._layout.length <= y) {
          this.makeNewRow();
        }
        for (let x = item.x; x < item.x + item.width; x++) {
          this._layout[y][x].add(item.id);

          if (this._layout[y][x].size > 1) {
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

  get items(): LayoutEngineItem[] {
    return [...this._items.values()];
  }

  getItem(itemId: ItemId): LayoutEngineItem {
    const item = this._items.get(itemId);
    if (!item) {
      throw new Error(`Item with id "${itemId}" not found in the grid.`);
    }
    return item;
  }

  getCell(x: number, y: number): LayoutEngineItem[] {
    if (!this._layout[y] || !this._layout[y][x]) {
      return [];
    }
    const cellItems: LayoutEngineItem[] = [];
    for (const itemId of this._layout[y][x]) {
      cellItems.push(this.getItem(itemId));
    }
    return cellItems;
  }

  getCellOverlap(x: number, y: number, itemId: ItemId): null | LayoutEngineItem {
    for (const item of this.getCell(x, y)) {
      if (item.id !== itemId) {
        return item;
      }
    }
    return null;
  }

  protected makeNewRow() {
    const newRow = new Array<Set<ItemId>>();
    for (let x = 0; x < this._width; x++) {
      newRow.push(new Set());
    }
    this._layout.push(newRow);
    this._height = this._layout.length;
  }
}

export class LayoutEngineGrid extends ReadonlyLayoutEngineGrid {
  move(itemId: ItemId, x: number, y: number, onOverlap: (overlapId: ItemId, issuer: ItemId) => void): void {
    const moveTarget = this.getItem(itemId);

    this.removeLayoutItem(moveTarget);

    moveTarget.x = x;
    moveTarget.y = y;
    Object.assign(moveTarget, getItemRect(moveTarget));

    this.insertLayoutItem(moveTarget, onOverlap);
  }

  resize(itemId: ItemId, width: number, height: number, onOverlap: (overlapId: ItemId, issuer: ItemId) => void): void {
    const resizeTarget = this.getItem(itemId);

    this.removeLayoutItem(resizeTarget);

    resizeTarget.width = width;
    resizeTarget.height = height;
    Object.assign(resizeTarget, getItemRect(resizeTarget));

    this.insertLayoutItem(resizeTarget, onOverlap);
  }

  insert(item: GridLayoutItem, onOverlap: (overlapId: ItemId, issuer: ItemId) => void): void {
    this._items.set(item.id, { ...item, ...getItemRect(item) });

    if (item.x < 0 || item.y < 0 || item.x + item.width > this._width) {
      throw new Error("Inserting item is outside the boundaries.");
    }
    if (item.width < 1 || item.height < 1) {
      throw new Error("Inserting item has invalid size.");
    }

    for (let y = item.y; y < item.y + item.height; y++) {
      while (this._layout.length <= y) {
        this.makeNewRow();
      }
      for (let x = item.x; x < item.x + item.width; x++) {
        for (const overlapId of this._layout[y][x]) {
          onOverlap(overlapId, item.id);
        }
        this._layout[y][x].add(item.id);
      }
    }
  }

  remove(itemId: ItemId): void {
    const removeTarget = this.getItem(itemId);
    this._items.delete(itemId);
    this.removeLayoutItem(removeTarget);
  }

  private removeLayoutItem(item: GridLayoutItem): void {
    for (let y = item.y; y < item.y + item.height; y++) {
      for (let x = item.x; x < item.x + item.width; x++) {
        this._layout[y][x].delete(item.id);
      }
    }
  }

  private insertLayoutItem(item: GridLayoutItem, onOverlap: (overlapId: ItemId, issuer: ItemId) => void): void {
    for (let y = item.y; y < item.y + item.height; y++) {
      for (let x = item.x; x < item.x + item.width; x++) {
        while (!this._layout[y]) {
          this.makeNewRow();
        }
        for (const overlapId of this._layout[y][x]) {
          onOverlap(overlapId, item.id);
        }
        this._layout[y][x].add(item.id);
      }
    }
  }
}
