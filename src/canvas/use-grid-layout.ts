// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CanvasItem } from "./interfaces";
import type { GridLayoutItem } from "../internal/grid/index";
import { createContentGridItems, createPlaceholderGridItems } from "./layout-utils";

interface UseGridLayoutProps {
  items: CanvasItem<any>[];
  columns: number;
}

interface GridLayout {
  content: GridLayoutItem[];
  placeholders: GridLayoutItem[];
  columns: number;
  rows: number;
}

export default function useGridLayout({ items, columns }: UseGridLayoutProps): GridLayout {
  const content = createContentGridItems(items, columns);
  const rows = content.reduce((acc, item) => Math.max(acc, item.rowOffset + item.rowSpan - 1), 1);
  const placeholders = createPlaceholderGridItems(rows, columns);
  return { content, placeholders, columns, rows };
}
