// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class ListMap<K, V> {
  private _map = new Map<K, V>();
  private _indexMap = new Map<K, number>();
  private _entries = new Array<[K, V]>();

  get(key: K): undefined | V {
    return this._map.get(key);
  }

  set(key: K, value: V): void {
    const index = this._indexMap.get(key);

    if (index === undefined) {
      this._map.set(key, value);
      this._indexMap.set(key, this._entries.length);
      this._entries.push([key, value]);
    } else {
      this._map.set(key, value);
      this._entries[index] = [key, value];
    }
  }

  delete(key: K): void {
    const index = this._indexMap.get(key);

    if (index !== undefined) {
      this._map.delete(key);
      this._indexMap.delete(key);
      this._entries.splice(index, 1);
    }
  }

  entries(): readonly [K, V][] {
    return this._entries;
  }
}
