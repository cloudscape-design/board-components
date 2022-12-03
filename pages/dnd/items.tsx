// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { ReactNode } from "react";
import { DashboardItemProps, DashboardLayoutProps } from "../../lib/components";
import { fromMatrix } from "../../src/internal/debug-tools";
import { DashboardItemBase } from "../../src/internal/interfaces";
import { exportItemsLayout } from "../../src/internal/utils/layout";
import { PaletteProps } from "../../src/palette/interfaces";
import { Counter } from "./commons";
import classnames from "./engine.module.css";
import { ResourceCountChart } from "./resource-count-chart";
import { RevenueChart } from "./revenue-chart";

interface ItemData {
  content: (contentSize: DashboardItemProps.ContentSize) => ReactNode;
  title: string;
  description: string;
}

const defaultDefinition = { defaultRowSpan: 1, defaultColumnSpan: 1 };
const createDefaultWidget = (id: string) => ({
  title: `Widget ${id}`,
  description: "Dummy description",
  content: () => "Dummy content",
  definition: defaultDefinition,
});

export const demoWidgets: Record<string, { data: ItemData; definition?: PaletteProps.Item["definition"] } | undefined> =
  {
    D: {
      definition: { defaultColumnSpan: 2, defaultRowSpan: 1, minColumnSpan: 2, minRowSpan: 1 },
      data: { title: "Demo widget", description: "Most minimal widget", content: () => <>Hello world!</> },
    },
    counter: {
      definition: { defaultRowSpan: 2, defaultColumnSpan: 2 },
      data: { title: "Counter", description: "State management demo", content: () => <Counter /> },
    },
    docked1: {
      data: {
        title: "Responsive content",
        description: "Responsive content",
        content: () => (
          <div className={clsx(classnames["demo-item-content"], classnames["demo-item-responsive-content"])}>
            Responsive content
          </div>
        ),
      },
    },
    docked2: {
      data: {
        title: "Large content",
        description: "Large content",
        content: () => (
          <div className={clsx(classnames["demo-item-content"], classnames["demo-item-large-content"])}>
            Large content
          </div>
        ),
      },
    },
    docked3: {
      data: {
        title: "Scrollable content",
        description: "Scrollable content",
        content: ({ maxWidth, maxHeight }) => (
          <div
            className={clsx(classnames["demo-item-content"], classnames["demo-item-scrollable-content"])}
            style={{ maxWidth, maxHeight }}
          >
            <div>Scrollable content</div>
          </div>
        ),
      },
    },
    revenue: {
      definition: { defaultColumnSpan: 1, defaultRowSpan: 2, minColumnSpan: 1, minRowSpan: 2 },
      data: {
        title: "Revenue",
        description: "Revenue over time chart",
        content: ({ maxWidth = 0, maxHeight = 0 }) => {
          if (maxHeight < 200 || maxWidth < 300) {
            return (
              <div
                className={clsx(classnames["demo-item-content"], classnames["demo-scrollable-revenue"])}
                style={{ maxWidth, maxHeight }}
              >
                <div>
                  <RevenueChart height={250} />
                </div>
              </div>
            );
          }

          return <RevenueChart height={Math.max(200, maxHeight) - 150} />;
        },
      },
    },
    resourceCount: {
      definition: { defaultColumnSpan: 1, defaultRowSpan: 2, minColumnSpan: 1, minRowSpan: 2 },
      data: {
        title: "Resource count",
        description: "Resource count pie chart",
        content: ({ maxWidth = 0, maxHeight = 0 }) => {
          let size: "small" | "medium" | "large" = "small";

          if (maxWidth > 300 && maxHeight > 300) {
            size = "medium";
          }

          if (maxWidth > 450 && maxHeight > 450) {
            size = "large";
          }

          return <ResourceCountChart size={size} />;
        },
      },
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
      content: () => "",
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
