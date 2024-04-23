// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayout, GridLayoutItem } from "../interfaces";
import { InsertCommand, MoveCommand, ResizeCommand } from "../layout-engine/interfaces";
import { Position } from "../utils/position";
import { toMatrix } from ".";

export type GenerateMoveType = "any" | "vertical" | "horizontal";

export interface GenerateGridOptions {
  width?: number;
  totalItems?: number;
  averageItemWidth?: number;
  averageItemHeight?: number;
}

export interface GenerateGridResizeOptions {
  maxWidthIncrement?: number;
  maxWidthDecrement?: number;
  maxHeightIncrement?: number;
  maxHeightDecrement?: number;
}

export interface GenerateGridInsertOptions {
  maxWidth?: number;
  maxHeight?: number;
}

const LETTER_INDICES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateGrid(options?: GenerateGridOptions): GridLayout {
  const width = options?.width ?? 6;
  const totalItems = options?.totalItems ?? 20;
  const averageItemWidth = options?.averageItemWidth ?? 1.44;
  const averageItemHeight = options?.averageItemHeight ?? 1.44;

  const allowance = {
    horizontal: Math.floor(totalItems * (averageItemWidth - 1)),
    vertical: Math.floor(totalItems * (averageItemHeight - 1)),
  };

  const items: GridLayoutItem[] = [...Array(totalItems)].map((_, index) => ({
    id: getGridItemId(index),
    width: 1,
    height: 1,
    y: 0,
    x: 0,
  }));

  let selectedAllowance: "horizontal" | "vertical" = "horizontal";
  while (allowance.horizontal > 0 || allowance.vertical > 0) {
    if (allowance.horizontal === 0) {
      selectedAllowance = "vertical";
    } else if (allowance.vertical === 0) {
      selectedAllowance = "horizontal";
    } else {
      selectedAllowance = selectedAllowance === "horizontal" ? "vertical" : "horizontal";
    }

    const index = getRandomIndex(items);

    if (selectedAllowance === "horizontal") {
      items[index].width = Math.min(width - items[index].x, items[index].width + 1);
      for (let i = 0; i < items[index].height; i++) {
        allowance.horizontal--;
      }
    } else {
      items[index].height++;
      for (let i = 0; i < items[index].width; i++) {
        allowance.vertical--;
      }
    }
  }

  const grid: string[][] = [];

  for (const item of items) {
    item.x = getRandomOffset(width, item.width);

    for (let y = 0; y < grid.length; y++) {
      for (let x = item.x; x < item.x + item.width; x++) {
        if (grid[y][x].trim()) {
          item.y = y + 1;
          break;
        }
      }
    }

    for (let y = item.y; y < item.y + item.height; y++) {
      while (grid.length <= y) {
        grid.push([...Array(width)].map(() => " "));
      }

      for (let x = item.x; x < item.x + item.width; x++) {
        grid[y][x] = item.id;
      }
    }
  }

  items.sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y));

  return { items, columns: width, rows: grid.length };
}

export function generateMove(grid: GridLayout, type: GenerateMoveType = "any"): MoveCommand {
  const textGrid = toMatrix(grid);
  const moveTarget = grid.items[getRandomIndex(grid.items)];

  const affordance: [Direction, number][] = [];

  if (moveTarget.y > 0) {
    affordance.push(["up", moveTarget.y]);
  }
  if (moveTarget.y + moveTarget.height <= textGrid.length) {
    affordance.push(["down", 1 + textGrid.length - (moveTarget.y + moveTarget.height)]);
  }
  if (moveTarget.x > 0) {
    affordance.push(["left", moveTarget.x]);
  }
  if (moveTarget.x + moveTarget.width < textGrid[0].length) {
    affordance.push(["right", textGrid[0].length - (moveTarget.x + moveTarget.width)]);
  }

  function swap(type: "vertical" | "horizontal" | "any"): Position {
    const verticalAffordance = affordance.filter(([direction]) => direction === "up" || direction === "down");
    const horizontalAffordance = affordance.filter(([direction]) => direction === "left" || direction === "right");
    const chosenAffordance =
      type === "any" ? affordance : type === "vertical" ? verticalAffordance : horizontalAffordance;

    if (chosenAffordance.length === 0) {
      throw new Error("Move is not possible");
    }

    const [direction, maxDistance] = chosenAffordance[getRandomIndex(chosenAffordance)];
    const distance = 1 + Math.floor(Math.random() * maxDistance);
    switch (direction) {
      case "up":
        return new Position({ y: moveTarget.y - distance, x: moveTarget.x });
      case "down":
        return new Position({ y: moveTarget.y + distance, x: moveTarget.x });
      case "left":
        return new Position({ y: moveTarget.y, x: moveTarget.x - distance });
      case "right":
        return new Position({ y: moveTarget.y, x: moveTarget.x + distance });
    }
  }

  function replace(): Position {
    const verticalAffordance = affordance.filter(([direction]) => direction === "up" || direction === "down");
    const horizontalAffordance = affordance.filter(([direction]) => direction === "left" || direction === "right");

    if (horizontalAffordance.length === 0) {
      throw new Error("Move is not possible");
    }

    const [directionVertical, maxDistanceVertical] = verticalAffordance[getRandomIndex(verticalAffordance)];
    const distanceVertical = 1 + Math.floor(Math.random() * maxDistanceVertical);

    const [directionHorizontal, maxDistanceHorizontal] = horizontalAffordance[getRandomIndex(horizontalAffordance)];
    const distanceHorizontal = 1 + Math.floor(Math.random() * maxDistanceHorizontal);

    switch (`${directionVertical}-${directionHorizontal}`) {
      case "top-left":
        return new Position({
          y: moveTarget.y - distanceVertical,
          x: moveTarget.x - distanceHorizontal,
        });
      case "top-right":
        return new Position({
          y: moveTarget.y - distanceVertical,
          x: moveTarget.x + distanceHorizontal,
        });
      case "bottom-left":
        return new Position({
          y: moveTarget.y + distanceVertical,
          x: moveTarget.x - distanceHorizontal,
        });
      case "bottom-right":
        return new Position({
          y: moveTarget.y + distanceVertical,
          x: moveTarget.x + distanceHorizontal,
        });
    }

    return new Position({ y: moveTarget.y, x: moveTarget.x });
  }

  const position = (() => {
    let repeatCounter = 0;
    while (repeatCounter < 10) {
      try {
        repeatCounter++;

        switch (type) {
          case "vertical":
            return swap("vertical");
          case "horizontal":
            return swap("horizontal");
          case "any":
            return Math.random() > 0.5 ? swap("any") : replace();
        }
      } catch {
        // noop
      }
    }

    throw new Error("Move is not possible");
  })();

  const path = generateRandomPath(new Position({ y: moveTarget.y, x: moveTarget.x }), position);

  return { itemId: moveTarget.id, path };
}

export function generateResize(grid: GridLayout, options?: GenerateGridResizeOptions): ResizeCommand {
  const maxWidthIncrement = options?.maxHeightIncrement ?? grid.columns - 1;
  const maxWidthDecrement = options?.maxHeightDecrement ?? grid.columns - 1;
  const maxHeightIncrement = options?.maxHeightIncrement ?? Math.floor((grid.items.length - 1) % 2) + 1;
  const maxHeightDecrement = options?.maxHeightDecrement ?? Math.floor((grid.items.length - 1) % 2) + 1;

  const resizeTarget = grid.items[getRandomIndex(grid.items)];

  let maxWidthDelta = getRandomDirection();
  if (maxWidthDelta === 1 && maxWidthIncrement) {
    maxWidthDelta *= maxWidthIncrement;
  } else if (maxWidthDelta === -1 && maxWidthDecrement) {
    maxWidthDelta *= maxWidthDecrement;
  } else if (maxWidthIncrement) {
    maxWidthDelta = maxWidthIncrement;
  } else {
    maxWidthDelta = -maxWidthDecrement;
  }
  if (resizeTarget.width + maxWidthDelta < 1) {
    maxWidthDelta = -(resizeTarget.width - 1);
  } else if (resizeTarget.x + resizeTarget.width + maxWidthDelta >= grid.columns) {
    maxWidthDelta = grid.columns - (resizeTarget.x + resizeTarget.width);
  }
  const widthDelta = Math.sign(maxWidthDelta) * getRandomInt(0, Math.abs(maxWidthDelta) + 1);

  let maxHeightDelta = getRandomDirection();
  if (maxHeightDelta === 1 && maxHeightIncrement) {
    maxHeightDelta *= maxHeightIncrement;
  } else if (maxHeightDelta === -1 && maxHeightDecrement) {
    maxHeightDelta *= maxHeightDecrement;
  } else if (maxHeightIncrement) {
    maxHeightDelta = maxHeightIncrement;
  } else {
    maxHeightDelta = -maxHeightDecrement;
  }
  if (resizeTarget.height + maxHeightDelta < 1) {
    maxHeightDelta = -(resizeTarget.height - 1);
  }
  const heightDelta = Math.sign(maxHeightDelta) * getRandomInt(0, Math.abs(maxHeightDelta) + 1);

  const path = generateRandomPath(
    new Position({ x: resizeTarget.x + resizeTarget.width, y: resizeTarget.y + resizeTarget.height }),
    new Position({
      x: resizeTarget.x + resizeTarget.width + widthDelta,
      y: resizeTarget.y + resizeTarget.height + heightDelta,
    }),
  );

  return { itemId: resizeTarget.id, path };
}

export function generateInsert(grid: GridLayout, insertId = "X", options?: GenerateGridInsertOptions): InsertCommand {
  const maxWidth = options?.maxWidth ?? grid.columns;
  const maxHeight = options?.maxHeight ?? Math.floor(grid.items.length / 2) + 1;

  const textGrid = toMatrix(grid);

  const y = getRandomIndex(textGrid);
  const x = getRandomIndex(textGrid[y]);
  const width = getRandomInt(1, Math.max(1, maxWidth + 1 - x));
  const height = getRandomInt(1, maxHeight + 1);

  return { itemId: insertId, width, height, path: [new Position({ x, y })] };
}

export function generateRandomPath(from: Position, to: Position): Position[] {
  const path = [];
  const directions: ["y", "x"] = ["y", "x"];

  const last = { ...from };
  while (last.y !== to.y || last.x !== to.x) {
    let direction = directions[getRandomIndex(directions)];
    if (last.y === to.y) {
      direction = "x";
    }
    if (last.x === to.x) {
      direction = "y";
    }
    last[direction] += to[direction] > from[direction] ? 1 : -1;
    path.push({ ...last });
  }

  return path;
}

function getRandomIndex(array: readonly unknown[]): number {
  return Math.floor(Math.random() * array.length);
}

function getRandomOffset(gridWidth: number, itemWidth: number): number {
  return Math.floor(Math.random() * (1 + gridWidth - itemWidth));
}

function getRandomDirection(): number {
  return Math.random() > 0.5 ? 1 : -1;
}

function getRandomInt(from: number, until: number): number {
  return Math.floor(Math.random() * (until - from)) + from;
}

function getGridItemId(index: number): string {
  const letter = LETTER_INDICES[index % LETTER_INDICES.length];
  const letterIndex = Math.floor(index / LETTER_INDICES.length);
  return letter + (letterIndex === 0 ? "" : letterIndex);
}
