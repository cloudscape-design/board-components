// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem } from "../interfaces";
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

export function normalizeMovePath(origin: Position, path: readonly Position[]): readonly Position[] {
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

  return normalizePathSteps(origin, normalizedPath);
}

export function normalizeResizePath(origin: Position, path: readonly Position[]): readonly Position[] {
  if (path.length === 0) {
    return path;
  }
  const last = path[path.length - 1];
  const normalizedPath = path.filter((step) => step.x <= last.x && step.y <= last.y);
  return normalizePathSteps(origin, normalizedPath);
}

// Ensures path only includes single-length steps.
function normalizePathSteps(origin: Position, path: readonly Position[]): readonly Position[] {
  const normalizedPath: Position[] = [];

  let prevX = origin.x;
  let prevY = origin.y;

  for (const step of path) {
    const vx = Math.sign(step.x - prevX);
    const vy = Math.sign(step.y - prevY);

    for (let x = prevX, y = prevY; x !== step.x || y !== step.y; ) {
      if (x !== step.x) {
        x += vx;
      } else {
        y += vy;
      }
      normalizedPath.push({ x, y });
    }

    prevX = step.x;
    prevY = step.y;
  }

  return normalizedPath;
}
