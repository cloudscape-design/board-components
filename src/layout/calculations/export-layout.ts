// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayoutItem } from "../../internal/base-types";
import { DashboardLayoutProps } from "../interfaces";

function range(from: number, length: number) {
  return Array.from({ length }, (_, i) => from + i);
}

function bubbleUpItems(grid: ReadonlyArray<GridLayoutItem>) {
  const matrix = grid.reduce((matrix, item) => {
    for (const x of range(item.x, item.width)) {
      if (!matrix[x]) {
        matrix[x] = [];
      }
      for (const y of range(item.y, item.height)) {
        matrix[x][y] = item;
      }
    }
    return matrix;
  }, [] as Array<Array<GridLayoutItem>>);
  for (const item of grid) {
    while (item.y > 1 && range(item.x, item.width).every((x) => !matrix[x][item.y - 1])) {
      item.y -= 1;
    }
  }
}

export function exportLayout<D>(
  grid: readonly GridLayoutItem[],
  sourceItems: readonly DashboardLayoutProps.Item<D>[]
): readonly DashboardLayoutProps.Item<D>[] {
  const sourceById = sourceItems.reduce(
    (map, item) => map.set(item.id, item),
    new Map<string, DashboardLayoutProps.Item<D>>()
  );

  bubbleUpItems(grid);

  const sortedLayout = grid.slice().sort((a, b) => {
    if (a.y !== b.y) {
      return a.y > b.y ? 1 : -1;
    }
    return a.x > b.x ? 1 : -1;
  });

  const canvasItems: DashboardLayoutProps.Item<D>[] = [];
  for (const layoutItem of sortedLayout) {
    const matchedCanvasItem = { ...sourceById.get(layoutItem.id)!, columnOffset: layoutItem.x };
    canvasItems.push(matchedCanvasItem);
  }

  return canvasItems;
}
