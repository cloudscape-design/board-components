// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem, ItemId } from "../interfaces";
import { checkItemsIntersection } from "./utils";

export class ReadonlyLayoutEngineGrid {
  protected _width: number;
  protected _height: number;

  // TODO: remove this
  protected _itemsMap = new Map<ItemId, GridLayoutItem>();
  protected _items = new Array<GridLayoutItem>();

  static clone(grid: ReadonlyLayoutEngineGrid): LayoutEngineGrid {
    const clone = new LayoutEngineGrid([], 0);
    clone._width = grid._width;
    clone._height = grid._height;
    for (const item of grid._items) {
      const itemClone = { ...item };
      clone._itemsMap.set(itemClone.id, itemClone);
      clone._items.push(itemClone);
    }
    return clone;
  }

  constructor(items: readonly GridLayoutItem[], columns: number) {
    this._width = columns;
    this._height = 0;

    for (const item of items) {
      if (item.x < 0 || item.y < 0 || item.x + item.width > this._width) {
        throw new Error("Invalid grid: items outside the boundaries.");
      }
      if (item.width < 1 || item.height < 1) {
        throw new Error("Invalid grid: items of invalid size.");
      }

      for (const gridItem of this._items) {
        if (checkItemsIntersection(gridItem, item)) {
          throw new Error("Invalid grid: items overlap.");
        }
      }

      const itemClone = { ...item };
      this._itemsMap.set(itemClone.id, itemClone);
      this._items.push(itemClone);
      this._height = Math.max(this.height, itemClone.y + itemClone.height);
    }
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get items(): GridLayoutItem[] {
    return this._items;
  }

  getItem(itemId: ItemId): GridLayoutItem {
    const item = this._itemsMap.get(itemId);
    if (!item) {
      throw new Error(`Item with id "${itemId}" not found in the grid.`);
    }
    return item;
  }

  getCell(x: number, y: number): GridLayoutItem[] {
    const cellProbe = { id: "", x, y, width: 1, height: 1 };
    return this._items.filter((item) => checkItemsIntersection(item, cellProbe));
  }

  getCellOverlap(x: number, y: number, itemId: ItemId): null | GridLayoutItem {
    for (const item of this.getCell(x, y)) {
      if (item.id !== itemId) {
        return item;
      }
    }
    return null;
  }
}

export class LayoutEngineGrid extends ReadonlyLayoutEngineGrid {
  move(itemId: ItemId, x: number, y: number, onOverlap: (overlapId: ItemId, issuer: ItemId) => void): void {
    const moveTarget = this.getItem(itemId);
    moveTarget.x = x;
    moveTarget.y = y;
    this.callOverlaps(moveTarget, onOverlap);
  }

  resize(itemId: ItemId, width: number, height: number, onOverlap: (overlapId: ItemId, issuer: ItemId) => void): void {
    const resizeTarget = this.getItem(itemId);
    resizeTarget.width = width;
    resizeTarget.height = height;
    this.callOverlaps(resizeTarget, onOverlap);
  }

  insert(item: GridLayoutItem, onOverlap: (overlapId: ItemId, issuer: ItemId) => void): void {
    if (item.x < 0 || item.y < 0 || item.x + item.width > this._width) {
      throw new Error("Inserting item is outside the boundaries.");
    }
    if (item.width < 1 || item.height < 1) {
      throw new Error("Inserting item has invalid size.");
    }
    const itemClone = { ...item };
    this._itemsMap.set(itemClone.id, itemClone);
    this._items.push(itemClone);
    this.callOverlaps(item, onOverlap);
  }

  remove(itemId: ItemId): void {
    this._itemsMap.delete(itemId);
    this._items = this._items.filter((item) => item.id !== itemId);
  }

  // TODO: make public
  private callOverlaps(item: GridLayoutItem, onOverlap: (overlapId: ItemId, issuer: ItemId) => void): void {
    for (let y = item.y; y < item.y + item.height; y++) {
      for (let x = item.x; x < item.x + item.width; x++) {
        const cellItems = this.getCell(x, y);
        for (const overlap of cellItems) {
          if (overlap.id !== item.id) {
            onOverlap(overlap.id, item.id);
          }
        }
      }
    }
  }
}
