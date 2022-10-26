// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LayoutItem, CanvasLayoutItem } from "./interfaces";

export function canvasItemsToLayout<D>(items: readonly CanvasLayoutItem<D>[], columns: number): readonly LayoutItem[] {
  let x = 0;
  let y = 0;
  const layout: LayoutItem[] = [];
  for (const item of items) {
    const colspan = item.columnSpan ?? 1;
    if (x + colspan > columns) {
      y++;
      x = 0;
    }
    layout.push({ id: item.id, x, y, width: colspan });
    x += colspan;
  }
  return layout;
}
