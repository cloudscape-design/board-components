// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayoutItem } from "../interfaces";
import { Position } from "../utils/position";
import { CommittedMove } from "./interfaces";

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function sortGridItems(items: GridLayoutItem[]): readonly GridLayoutItem[] {
  return items.sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y));
}

export function normalizeMovePath(origin: Position, path: readonly Position[]): readonly Position[] {
  path = normalizePathOrigin(origin, path);

  // Store last visited indexes per position.
  const positionToLastIndex = new Map<string, number>();
  for (let index = 0; index < path.length; index++) {
    positionToLastIndex.set(`${path[index].x}:${path[index].y}`, index);
  }

  // Compose path from last visited indices only.
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
  path = normalizePathOrigin(origin, path);

  if (path.length === 0) {
    return [];
  }

  const normalizedPath: Position[] = [path[path.length - 1]];
  for (let stepIndex = path.length - 2; stepIndex >= 0; stepIndex--) {
    const prev = normalizedPath[normalizedPath.length - 1];
    const current = path[stepIndex];
    if (current.x < prev.x || current.y < prev.y) {
      normalizedPath.push(current);
    }
  }
  normalizedPath.reverse();

  return normalizePathSteps(origin, normalizedPath);
}

export function createMove(
  type: CommittedMove["type"],
  item: GridLayoutItem,
  next: Position,
  score = 0,
): CommittedMove {
  const distanceX = type === "RESIZE" ? next.x - item.width : next.x - item.x;
  const distanceY = type === "RESIZE" ? next.y - item.height : next.y - item.y;
  return {
    type,
    itemId: item.id,
    x: type !== "RESIZE" ? next.x : item.x,
    y: type !== "RESIZE" ? next.y : item.y,
    width: type === "RESIZE" ? next.x : item.width,
    height: type === "RESIZE" ? next.y : item.height,
    direction: distanceX > 0 ? "right" : distanceX < 0 ? "left" : distanceY < 0 ? "up" : "down",
    distanceX,
    distanceY,
    score,
  };
}

export function getMoveOriginalRect(move: CommittedMove): Rect {
  return {
    left: move.x - move.distanceX,
    right: move.x - move.distanceX + move.width - 1,
    top: move.y - move.distanceY,
    bottom: move.y - move.distanceY + move.height - 1,
  };
}

export function getMoveRect(move: CommittedMove): Rect {
  return {
    left: move.x,
    right: move.x + move.width - 1,
    top: move.y,
    bottom: move.y + move.height - 1,
  };
}

export function checkItemsIntersection(i1: GridLayoutItem, i2: GridLayoutItem): boolean {
  if (i1.id === i2.id) {
    return false;
  }
  return (
    i1.x <= i2.x + i2.width - 1 &&
    i2.x <= i1.x + i1.width - 1 &&
    i1.y <= i2.y + i2.height - 1 &&
    i2.y <= i1.y + i1.height - 1
  );
}

export function checkOppositeDirections(d1: Direction, d2: Direction): boolean {
  return (
    (d1 === "down" && d2 === "up") ||
    (d1 === "up" && d2 === "down") ||
    (d1 === "left" && d2 === "right") ||
    (d1 === "right" && d2 === "left")
  );
}

// Removes path prefixes that return to the original location.
function normalizePathOrigin(origin: Position, path: readonly Position[]): readonly Position[] {
  let lastOriginIndex = -1;
  for (let i = 0; i < path.length; i++) {
    if (path[i].x === origin.x && path[i].y === origin.y) {
      lastOriginIndex = i;
    }
  }
  return path.slice(lastOriginIndex + 1);
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
      normalizedPath.push(new Position({ x, y }));
    }

    prevX = step.x;
    prevY = step.y;
  }

  return normalizedPath;
}
