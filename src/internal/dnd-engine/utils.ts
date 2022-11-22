// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem } from "../base-types";
import { Position } from "../interfaces";

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function sortGridItems(items: readonly GridLayoutItem[]): readonly GridLayoutItem[] {
  return [...items].sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y));
}

export function getItemRect(item: GridLayoutItem): Rect {
  return {
    left: item.x,
    right: item.x + item.width - 1,
    top: item.y,
    bottom: item.y + item.height - 1,
  };
}

export function normalizePath(origin: Position, path: readonly Position[]): readonly Position[] {
  // Remove path prefixes that return to the original location.
  for (let i = 0; i < path.length; i++) {
    if (path[i].x === origin.x && path[i].y === origin.y) {
      path = path.slice(i + 1);
    }
  }

  // Store last visited indexes per position.
  const positionToLastIndex = new Map<string, number>();
  for (let index = 0; index < path.length; index++) {
    positionToLastIndex.set(`${path[index].x}:${path[index].y}`, index);
  }

  // Compose path from last visited indixes only.
  const normalizedPath: Position[] = [];
  let index = 0;
  while (index < path.length) {
    const lastVisitedIndex = positionToLastIndex.get(`${path[index].x}:${path[index].y}`)!;
    normalizedPath.push(path[lastVisitedIndex]);
    index = lastVisitedIndex + 1;
  }

  return normalizedPath;
}
