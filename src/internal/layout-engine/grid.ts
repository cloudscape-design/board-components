// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem, ItemId } from "../interfaces";
import { checkItemsIntersection } from "./utils";

export class ReadonlyLayoutEngineGrid {
  protected _width: number;
  protected _height: number;
  protected _items = new Array<GridLayoutItem>();
  protected _itemsMap = new Map<ItemId, GridLayoutItem>();

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

  getOverlaps(item: GridLayoutItem): GridLayoutItem[] {
    return this._items.filter((gridItem) => checkItemsIntersection(gridItem, item));
  }
}

export class LayoutEngineGrid extends ReadonlyLayoutEngineGrid {
  move(itemId: ItemId, x: number, y: number): void {
    const item = this.getItem(itemId);
    item.x = x;
    item.y = y;
    this._height = Math.max(this.height, item.y + item.height);
  }

  resize(itemId: ItemId, width: number, height: number): void {
    const item = this.getItem(itemId);
    item.width = width;
    item.height = height;
    this._height = Math.max(this.height, item.y + item.height);
  }

  insert(item: GridLayoutItem): void {
    if (item.x < 0 || item.y < 0 || item.x + item.width > this._width) {
      throw new Error("Inserting item is outside the boundaries.");
    }
    if (item.width < 1 || item.height < 1) {
      throw new Error("Inserting item has invalid size.");
    }
    const itemClone = { ...item };
    this._itemsMap.set(itemClone.id, itemClone);
    this._items.push(itemClone);
    this._height = Math.max(this.height, item.y + item.height);
  }

  remove(itemId: ItemId): void {
    this._itemsMap.delete(itemId);
    this._items = this._items.filter((item) => item.id !== itemId);
  }
}
