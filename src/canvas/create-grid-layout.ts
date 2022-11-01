// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createGridItems, createGridPlaceholders, GridLayoutItem, CanvasLayoutItem } from "../internal/layout/index";

interface UseGridLayoutProps {
  items: readonly CanvasLayoutItem<any>[];
  columns: number;
}

interface GridLayout {
  content: readonly GridLayoutItem[];
  placeholders: readonly GridLayoutItem[];
  columns: number;
  rows: number;
}

export default function createGridLayout({ items, columns }: UseGridLayoutProps): GridLayout {
  const content = createGridItems(items, columns);
  const rows = content.reduce((acc, item) => Math.max(acc, item.rowOffset + item.rowSpan - 1), 1);
  const placeholders = createGridPlaceholders(rows, columns);
  return { content, placeholders, columns, rows };
}
