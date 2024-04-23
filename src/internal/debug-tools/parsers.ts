// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout } from "../interfaces";
import { GridLayoutItem, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { GridMatrix } from "./interfaces";

const LETTER_INDICES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function fromMatrix(matrix: GridMatrix): GridLayout {
  const items: GridLayoutItem[] = [];
  const added = new Set<ItemId>();

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const ids = matrix[y][x].split("/").map((id) => id.trim());

      for (const id of ids) {
        if (id.trim().length === 0) {
          continue;
        }

        if (!added.has(id)) {
          const item = { id, y, x, width: 1, height: 1 };

          for (let itemX = x + 1; itemX < matrix[y].length; itemX++) {
            if (matrix[y][itemX] === id) {
              x++;
              item.width++;
            } else {
              break;
            }
          }

          for (let itemY = y + 1; itemY < matrix.length; itemY++) {
            if (matrix[itemY][x] === id) {
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
  }

  return { items, columns: matrix[0]?.length ?? 0, rows: matrix.length };
}

// Path is defined like "A1 A2 B2 C2" where A-C is a column index (A-based) and 1-2 is a row index (1-based).
export function fromTextPath(textPath: string, gridArg: GridLayout | GridMatrix) {
  // Parse path.
  const positions = textPath.split(" ").filter(Boolean);
  const [start, ...rest] = positions.map((pos) => {
    const x = LETTER_INDICES.indexOf(pos[0]);
    const y = parseInt(pos.slice(1)) - 1;
    return { y, x };
  });

  // Find move target.
  const grid = Array.isArray(gridArg) ? fromMatrix(gridArg) : gridArg;
  const targets = grid.items.filter(
    (item) => item.y <= start.y && start.y < item.y + item.height && item.x <= start.x && start.x < item.x + item.width,
  );
  if (targets.length === 0) {
    throw new Error("No move target corresponding given path.");
  }
  if (targets.length > 1) {
    throw new Error("Multiple move targets corresponding given path.");
  }
  const [moveTarget] = targets;

  // Adjust path to target's top-left point.
  const yOffset = start.y - moveTarget.y;
  const xOffset = start.x - moveTarget.x;
  return { itemId: moveTarget.id, path: rest.map(({ y, x }) => new Position({ y: y - yOffset, x: x - xOffset })) };
}
