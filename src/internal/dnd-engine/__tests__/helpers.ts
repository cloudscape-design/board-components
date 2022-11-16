// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { applyMove, applyResize, refloatGrid } from "../engine";
import { GridDefinition, Item, ItemId, MoveCommand, Position, ResizeCommand } from "../interfaces";

export const LETTER_INDICES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Path is defined like "A1 A2 B2 C2" where A-C is a column index (A-based) and 1-2 is a row index (1-based).
function parseTextPath(path: string): Position[] {
  const positions = path.split(" ").filter(Boolean);
  return positions.map((pos) => {
    const x = LETTER_INDICES.indexOf(pos[0]);
    const y = parseInt(pos.slice(1)) - 1;
    return { y, x };
  });
}

function createMovePath(grid: GridDefinition, path: Position[]): MoveCommand {
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
export function runMoveAndRefloat(
  start: GridDefinition | string[][],
  path: string | MoveCommand,
  end: string[][] = []
) {
  const expectation = stringifyTextGrid(end);
  const grid = Array.isArray(start) ? parseTextGrid(start) : start;
  const movePath = typeof path === "string" ? createMovePath(grid, parseTextPath(path)) : path;
  let transition = applyMove(grid, movePath);
  if (transition.blocks.length === 0) {
    const refloatTransition = refloatGrid(transition.end);
    transition = {
      start: transition.start,
      end: refloatTransition.end,
      moves: [...transition.moves, ...refloatTransition.moves],
      blocks: [],
    };
  }
  const result = stringifyTextGrid(createTextGrid(transition.end));
  return { transition, result, expectation };
}

export function runResizeAndRefloat(start: GridDefinition | string[][], resize: ResizeCommand, end: string[][] = []) {
  const expectation = stringifyTextGrid(end);
  const grid = Array.isArray(start) ? parseTextGrid(start) : start;
  let transition = applyResize(grid, resize);
  if (transition.blocks.length === 0) {
    const refloatTransition = refloatGrid(transition.end);
    transition = {
      start: transition.start,
      end: refloatTransition.end,
      moves: [...transition.moves, ...refloatTransition.moves],
      blocks: [],
    };
  }
  const result = stringifyTextGrid(createTextGrid(transition.end));
  return { transition, result, expectation };
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

export function forEachTimes<T>(times: number, array: T[], callback: (item: T) => void) {
  array.flatMap((item) => range(0, times).map(() => item)).forEach(callback);
}
