// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";
import { DashboardLayoutProps } from "../../lib/components";
import { fromMatrix } from "../../src/internal/debug-tools";
import { DashboardItemBase } from "../../src/internal/interfaces";
import { exportItemsLayout } from "../../src/internal/utils/layout";
import { PaletteProps } from "../../src/palette/interfaces";
import { Counter } from "./commons";

interface ItemData {
  content: ReactNode;
  title: string;
  description: string;
}

const defaultDefinition = { defaultRowSpan: 1, defaultColumnSpan: 1 };
const createDefaultWidget = (id: string) => ({
  title: `Widget ${id}`,
  description: "Dummy description",
  content: "Dummy content",
  definition: defaultDefinition,
});

export const demoWidgets: Record<string, { data: ItemData; definition?: PaletteProps.Item["definition"] } | undefined> =
  {
    D: {
      definition: { defaultColumnSpan: 2, defaultRowSpan: 1, minColumnSpan: 2, minRowSpan: 1 },
      data: { title: "Demo widget", description: "Most minimal widget", content: <>Hello world!</> },
    },
    counter: {
      definition: { defaultRowSpan: 2, defaultColumnSpan: 2 },
      data: { title: "Counter", description: "State management demo", content: <Counter /> },
    },
    docked1: {
      data: { title: "Generic docked 1", description: "No description", content: "No content" },
    },
    docked2: {
      data: { title: "Generic docked 2", description: "No description", content: "No content" },
    },
  };

for (let i = 2; i <= 10; i++) {
  demoWidgets[i] = { data: createDefaultWidget(i.toString()) };
}

export const storedPositions = [
  { id: "D", columnOffset: 0, rowSpan: 1, columnSpan: 1 },
  { id: "2", columnOffset: 1, rowSpan: 1, columnSpan: 2 },
  { id: "3", columnOffset: 3, rowSpan: 1, columnSpan: 1 },
  { id: "4", columnOffset: 0, rowSpan: 1, columnSpan: 1 },
  { id: "5", columnOffset: 1, rowSpan: 1, columnSpan: 1 },
  { id: "6", columnOffset: 2, rowSpan: 1, columnSpan: 1 },
  { id: "7", columnOffset: 0, rowSpan: 1, columnSpan: 1 },
  { id: "8", columnOffset: 1, rowSpan: 1, columnSpan: 1 },
  { id: "9", columnOffset: 2, rowSpan: 1, columnSpan: 1 },
  { id: "10", columnOffset: 0, rowSpan: 1, columnSpan: 1 },
];

export const demoLayoutItems: readonly DashboardLayoutProps.Item<ItemData>[] = storedPositions.map((pos) => {
  const config = demoWidgets[pos.id];
  return {
    ...pos,
    data: config?.data ?? createDefaultWidget(pos.id),
    definition: config?.definition ?? defaultDefinition,
  };
});

export const demoPaletteItems: readonly PaletteProps.Item<ItemData>[] = Object.entries(demoWidgets)
  .filter(([key]) => !storedPositions.find((pos) => pos.id === key))
  .map(([key, widget]) => ({
    id: key,
    definition: widget?.definition ?? defaultDefinition,
    data: widget?.data ?? createDefaultWidget(key),
  }));

export const letterWidgets = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].reduce((acc, letter) => {
  acc[letter] = {
    id: letter,
    definition: defaultDefinition,
    data: {
      title: `Widget ${letter}`,
      description: "Empty widget",
      content: "",
    },
  };
  return acc;
}, {} as { [id: string]: DashboardItemBase<ItemData> });

export function createLetterItems(grid: null | string[][]) {
  if (!grid) {
    return null;
  }

  const layoutItems = exportItemsLayout(
    fromMatrix(grid),
    Object.values(letterWidgets).map((item) => ({ ...item, columnOffset: 0, columnSpan: 0, rowSpan: 0 }))
  );
  const usedLetterItems = new Set(layoutItems.map((item) => item.id));
  const paletteItems = Object.values(letterWidgets).filter((item) => !usedLetterItems.has(item.id));

  return { layoutItems, paletteItems };
}
