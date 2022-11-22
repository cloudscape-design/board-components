// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayout } from "../../internal/interfaces";
import { DashboardLayoutProps } from "../interfaces";

export function exportLayout<D>(
  grid: GridLayout,
  sourceItems: readonly DashboardLayoutProps.Item<D>[]
): readonly DashboardLayoutProps.Item<D>[] {
  const sourceById = sourceItems.reduce(
    (map, item) => map.set(item.id, item),
    new Map<string, DashboardLayoutProps.Item<D>>()
  );

  const sortedLayout = grid.items.slice().sort((a, b) => {
    if (a.y !== b.y) {
      return a.y > b.y ? 1 : -1;
    }
    return a.x > b.x ? 1 : -1;
  });

  const canvasItems: DashboardLayoutProps.Item<D>[] = [];
  for (const layoutItem of sortedLayout) {
    const matchedCanvasItem = {
      ...sourceById.get(layoutItem.id)!,
      columnOffset: layoutItem.x,
      columnSpan: layoutItem.width,
      rowSpan: layoutItem.height,
    };
    canvasItems.push(matchedCanvasItem);
  }

  return canvasItems;
}
