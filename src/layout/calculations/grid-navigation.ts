// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayout, GridLayoutItem, ItemId } from "../../internal/interfaces";

export function getNextItem(
  layout: GridLayout,
  selectedItem: GridLayoutItem,
  direction: Direction
): null | GridLayoutItem {
  const matrix = createIdMatrix(layout);

  let fromX = selectedItem.x;
  let fromY = selectedItem.y;

  do {
    switch (direction) {
      case "left":
        fromX--;
        break;
      case "right":
        fromX++;
        break;
      case "up":
        fromY--;
        break;
      case "down":
        fromY++;
        break;
    }

    for (let y = fromY; y < fromY + selectedItem.height; y++) {
      for (let x = fromX; x < fromX + selectedItem.width; x++) {
        const itemId = matrix[y]?.[x];
        if (itemId && itemId !== selectedItem.id) {
          return layout.items.find((item) => item.id === itemId)!;
        }
      }
    }
  } while (fromX >= 0 && fromX < layout.columns && fromY >= 0 && fromY < layout.rows);

  return null;
}

function createIdMatrix(layout: GridLayout): ItemId[][] {
  const matrix: ItemId[][] = [];

  for (const item of layout.items) {
    for (let y = item.y; y < item.y + item.height; y++) {
      while (matrix.length <= y) {
        matrix.push([...Array(layout.columns)].map(() => ""));
      }
      for (let x = item.x; x < item.x + item.width; x++) {
        matrix[y][x] = item.id;
      }
    }
  }

  return matrix;
}
