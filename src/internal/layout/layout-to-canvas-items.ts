// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DashboardLayoutProps } from "../../layout";
import { LayoutItem } from "./interfaces";

export function layoutToCanvasItems<D>(
  grid: readonly LayoutItem[],
  sourceItems: readonly DashboardLayoutProps.Item<D>[]
): readonly DashboardLayoutProps.Item<D>[] {
  const sourceById = sourceItems.reduce(
    (map, item) => map.set(item.id, item),
    new Map<string, DashboardLayoutProps.Item<D>>()
  );

  const sortedLayout = grid.slice().sort((a, b) => {
    if (a.y !== b.y) {
      return a.y > b.y ? 1 : -1;
    }
    return a.x > b.x ? 1 : -1;
  });

  const canvasItems: DashboardLayoutProps.Item<D>[] = [];

  let currentRow = 0;
  let currentColumnOffset = 1;

  for (const layoutItem of sortedLayout) {
    if (layoutItem.y !== currentRow) {
      currentRow = layoutItem.y;
      currentColumnOffset = 1;
    }
    const matchedCanvasItem = { ...sourceById.get(layoutItem.id)!, columnOffset: currentColumnOffset };
    canvasItems.push(matchedCanvasItem);
    currentColumnOffset += matchedCanvasItem.columnSpan;
  }

  return canvasItems;
}
