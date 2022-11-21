// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Item } from "./interfaces";

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function sortGridItems(items: readonly Item[]): readonly Item[] {
  return [...items].sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y));
}

export function getItemRect(item: Item): Rect {
  return {
    left: item.x,
    right: item.x + item.width - 1,
    top: item.y,
    bottom: item.y + item.height - 1,
  };
}
