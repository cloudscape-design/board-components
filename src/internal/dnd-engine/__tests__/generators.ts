// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction } from "../dnd-grid";
import { GridDefinition, Item, MoveCommand, Position, ResizeCommand } from "../interfaces";
import { LETTER_INDICES, createTextGrid } from "./helpers";

type GenerateMoveType = "horizontal-or-vertical" | "vertical" | "horizontal" | "any";

export function generateGrid(
  width = 6,
  totalItems = 20,
  averageItemWidth = 1.44,
  averageItemHeight = 1.44
): GridDefinition {
  const allowance = {
    horizontal: Math.floor(totalItems * (averageItemWidth - 1)),
    vertical: Math.floor(totalItems * (averageItemHeight - 1)),
  };

  const items: Item[] = [...Array(totalItems)].map((_, index) => ({
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
      items[index].width++;
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

  return { items, width };
}

export function generateMovePath(grid: GridDefinition, type: GenerateMoveType = "any"): MoveCommand {
  const textGrid = createTextGrid(grid);
  const moveTarget = grid.items[getRandomIndex(grid.items)];

  const affordance: [Direction, number][] = [];

  if (moveTarget.y > 0) {
    affordance.push(["top", moveTarget.y]);
  }
  if (moveTarget.y + moveTarget.height <= textGrid.length) {
    affordance.push(["bottom", 1 + textGrid.length - (moveTarget.y + moveTarget.height)]);
  }
  if (moveTarget.x > 0) {
    affordance.push(["left", moveTarget.x]);
  }
  if (moveTarget.x + moveTarget.width < textGrid[0].length) {
    affordance.push(["right", textGrid[0].length - (moveTarget.x + moveTarget.width)]);
  }

  function swap(type: "vertical" | "horizontal" | "any"): Position {
    const verticalAffordance = affordance.filter(([direction]) => direction === "top" || direction === "bottom");
    const horizontalAffordance = affordance.filter(([direction]) => direction === "left" || direction === "right");
    const chosenAffordance =
      type === "any" ? affordance : type === "vertical" ? verticalAffordance : horizontalAffordance;

    if (chosenAffordance.length === 0) {
      throw new Error("Move is not possible");
    }

    const [direction, maxDistance] = chosenAffordance[getRandomIndex(chosenAffordance)];
    const distance = 1 + Math.floor(Math.random() * maxDistance);
    switch (direction) {
      case "top":
        return { y: moveTarget.y - distance, x: moveTarget.x };
      case "bottom":
        return { y: moveTarget.y + distance, x: moveTarget.x };
      case "left":
        return { y: moveTarget.y, x: moveTarget.x - distance };
      case "right":
        return { y: moveTarget.y, x: moveTarget.x + distance };
    }
  }

  function replace(): Position {
    const verticalAffordance = affordance.filter(([direction]) => direction === "top" || direction === "bottom");
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
        return {
          y: moveTarget.y - distanceVertical,
          x: moveTarget.x - distanceHorizontal,
        };
      case "top-right":
        return {
          y: moveTarget.y - distanceVertical,
          x: moveTarget.x + distanceHorizontal,
        };
      case "bottom-left":
        return {
          y: moveTarget.y + distanceVertical,
          x: moveTarget.x - distanceHorizontal,
        };
      case "bottom-right":
        return {
          y: moveTarget.y + distanceVertical,
          x: moveTarget.x + distanceHorizontal,
        };
    }

    return { y: moveTarget.y, x: moveTarget.x };
  }

  const position = (() => {
    let repeatCounter = 0;
    while (repeatCounter < 10) {
      try {
        repeatCounter++;

        switch (type) {
          case "horizontal-or-vertical":
            return swap("any");
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

  const path = createRandomPath({ y: moveTarget.y, x: moveTarget.x }, position);

  return { itemId: moveTarget.id, path };
}

export function generateResize(
  grid: GridDefinition,
  maxWidthIncrement = grid.width - 1,
  maxWidthDecrement = grid.width - 1,
  maxHeightIncrement = Math.floor((grid.items.length - 1) % 2) + 1,
  maxHeightDecrement = Math.floor((grid.items.length - 1) % 2) + 1
): ResizeCommand {
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
  } else if (resizeTarget.x + resizeTarget.width + maxWidthDelta >= grid.width) {
    maxWidthDelta = grid.width - (resizeTarget.x + resizeTarget.width);
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

  return { itemId: resizeTarget.id, width: resizeTarget.width + widthDelta, height: resizeTarget.height + heightDelta };
}

function createRandomPath(from: Position, to: Position): Position[] {
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
