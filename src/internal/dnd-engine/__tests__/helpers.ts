// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { applyMove, refloatGrid } from "../engine";
import { Item, GridDefinition, ItemId, Direction, MovePath, Position, GridTransition } from "../interfaces";

const LETTER_INDICES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type TestCase = [
  description: string,
  runner: () => { expectation: string; result: string; transition: GridTransition }
];

// Path is defined like "A1 A2 B2 C2" where A-C is a column index (A-based) and 1-2 is a row index (1-based).
function parseTextPath(path: string): Position[] {
  const positions = path.split(" ").filter(Boolean);
  return positions.map((pos) => {
    const x = LETTER_INDICES.indexOf(pos[0]);
    const y = parseInt(pos.slice(1)) - 1;
    return { y, x };
  });
}

function createMovePath(grid: GridDefinition, path: Position[]): MovePath {
  const [start, ...rest] = path;
  const moveTarget = grid.items.find(
    (item) => item.y <= start.y && start.y < item.y + item.height && item.x <= start.x && start.x < item.x + item.width
  );
  if (!moveTarget) {
    throw new Error("Invariant violation: no move target corresponding given path.");
  }
  const yOffset = start.y - moveTarget.y;
  const xOffset = start.x - moveTarget.x;
  return { itemId: moveTarget.id, path: rest.map(({ y, x }) => ({ y: y - yOffset, x: x - xOffset })) };
}

/**
 * Creates test definition for applyMove featuring simple text-based input definition and results comparison.
 */
export function createMoveTestSuite(
  description: string,
  start: string[][],
  path: string,
  expectation: string[][]
): TestCase {
  const run = createMoveRunner(start, path);
  return [
    description,
    () => {
      const transition = run();
      return {
        expectation: stringifyTextGrid(expectation),
        result: stringifyTextGrid(createTextGrid(transition.end)),
        transition,
      };
    },
  ];
}

export function createMoveRunner(textGrid: string[][], path: string): () => GridTransition {
  return () => {
    const grid = parseTextGrid(textGrid);
    const movePath = createMovePath(grid, parseTextPath(path));
    const applyTransition = applyMove(parseTextGrid(textGrid), movePath);

    if (applyTransition.blocks.length === 0) {
      const refloatTransition = refloatGrid(applyTransition.end);
      return {
        start: applyTransition.start,
        end: refloatTransition.end,
        moves: [...applyTransition.moves, ...refloatTransition.moves],
        blocks: [],
      };
    }

    return applyTransition;
  };
}

export function parseTextGrid(textGrid: string[][]): GridDefinition {
  const items: Item[] = [];
  const added = new Set<ItemId>();

  for (let y = 0; y < textGrid.length; y++) {
    for (let x = 0; x < textGrid[y].length; x++) {
      const id = textGrid[y][x];
      if (id.trim().length === 0) {
        continue;
      }

      if (!added.has(id)) {
        const item = { id, y, x, width: 1, height: 1 };

        for (let itemX = x + 1; itemX < textGrid[y].length; itemX++) {
          if (textGrid[y][itemX] === id) {
            item.width++;
          } else {
            break;
          }
        }

        for (let itemY = y + 1; itemY < textGrid.length; itemY++) {
          if (textGrid[itemY][x] === id) {
            item.height++;
          } else {
            break;
          }
        }

        items.push(item);
        added.add(id);
      }
    }
  }

  return { items, width: textGrid[0].length };
}

export function createTextGrid(gridDefinition: GridDefinition): string[][] {
  const textGrid: string[][] = [];

  for (const item of gridDefinition.items) {
    for (let y = item.y; y < item.y + item.height; y++) {
      while (textGrid.length <= y) {
        textGrid.push([...Array(gridDefinition.width)].map(() => " "));
      }

      for (let x = item.x; x < item.x + item.width; x++) {
        const newValue = textGrid[y][x] === " " ? item.id : textGrid[y][x] + "/" + item.id;
        textGrid[y][x] = newValue.split("/").sort().join("/");
      }
    }
  }

  return textGrid;
}

export function stringifyTextGrid(grid: string[][]): string {
  return grid.map((row) => row.join("\t")).join("\n");
}

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

function getRandomIndex(array: unknown[]): number {
  return Math.floor(Math.random() * array.length);
}

function getRandomOffset(gridWidth: number, itemWidth: number): number {
  return Math.floor(Math.random() * (1 + gridWidth - itemWidth));
}

function getGridItemId(index: number): string {
  const letter = LETTER_INDICES[index % LETTER_INDICES.length];
  const letterIndex = Math.floor(index / LETTER_INDICES.length);
  return letter + (letterIndex === 0 ? "" : letterIndex);
}

type MoveType = "swap" | "replace" | "swap-vertical" | "swap-horizontal" | "any";

export function generateMovePath(grid: GridDefinition, type: MoveType = "any"): MovePath {
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
          case "swap":
            return swap("any");
          case "swap-vertical":
            return swap("vertical");
          case "swap-horizontal":
            return swap("horizontal");
          case "replace":
            return replace();
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
