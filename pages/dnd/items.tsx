// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Box, Link, SpaceBetween } from "@cloudscape-design/components";
import { ReactNode } from "react";
import { DashboardLayoutProps } from "../../lib/components";
import { fromMatrix } from "../../src/internal/debug-tools";
import { DashboardItemBase } from "../../src/internal/interfaces";
import { exportItemsLayout } from "../../src/internal/utils/layout";
import { PaletteProps } from "../../src/palette/interfaces";
import { Counter } from "./commons";
import {
  DefaultContainer,
  FixedContainer,
  QueryContainer,
  ResponsiveContainer,
  ScrollableContainer,
  TwoColContainer,
} from "./containers";
import { EventsTable } from "./events-table";
import { ResourceCountChart } from "./resource-count-chart";
import { RevenueChart } from "./revenue-chart";

interface ItemData {
  title: string;
  description: string;
  content: ReactNode;
  footer?: ReactNode;
  disableContentPaddings?: boolean;
}

const defaultDefinition = { defaultRowSpan: 1, defaultColumnSpan: 1 };
const createDefaultWidget = (id: string) => ({
  title: `Widget ${id}`,
  description: "Dummy description",
  content: <DefaultContainer>Dummy content</DefaultContainer>,
  definition: defaultDefinition,
});

export const demoWidgets: Record<string, { data: ItemData; definition?: PaletteProps.Item["definition"] } | undefined> =
  {
    D: {
      definition: { defaultColumnSpan: 2, defaultRowSpan: 1, minColumnSpan: 2, minRowSpan: 1 },
      data: {
        title: "Demo widget",
        description: "Most minimal widget",
        content: <DefaultContainer>Hello world!</DefaultContainer>,
      },
    },
    counter: {
      definition: { defaultRowSpan: 2, defaultColumnSpan: 2 },
      data: {
        title: "Counter",
        description: "State management demo",
        content: (
          <DefaultContainer>
            <Counter />
          </DefaultContainer>
        ),
      },
    },
    responsive: {
      data: {
        title: "Responsive content",
        description: "Responsive content",
        content: <ResponsiveContainer>Responsive content</ResponsiveContainer>,
      },
    },
    large: {
      data: {
        title: "Large content",
        description: "Large content",
        content: (
          <FixedContainer width={600} height={400}>
            Large content
          </FixedContainer>
        ),
      },
    },
    scrollable: {
      data: {
        title: "Scrollable content",
        description: "Scrollable content",
        content: (
          <ScrollableContainer width={600} height={400}>
            Scrollable content
          </ScrollableContainer>
        ),
      },
    },
    revenue: {
      definition: { defaultColumnSpan: 1, defaultRowSpan: 2, minColumnSpan: 1, minRowSpan: 2 },
      data: {
        title: "Revenue",
        description: "Revenue over time chart",
        content: (
          <QueryContainer minWidth={400} minHeight={300}>
            {({ height = 0 }) => <RevenueChart height={height - 200} />}
          </QueryContainer>
        ),
      },
    },
    resourceCount: {
      definition: { defaultColumnSpan: 1, defaultRowSpan: 2, minColumnSpan: 1, minRowSpan: 2 },
      data: {
        title: "Resource count",
        description: "Resource count pie chart",
        content: (
          <QueryContainer minHeight={300}>
            {({ width = 0, height = 0 }) => {
              let size: "small" | "medium" | "large" = "small";
              if (width > 300 && height > 300) {
                size = "medium";
              }
              if (width > 450 && height > 450) {
                size = "large";
              }
              return <ResourceCountChart size={size} />;
            }}
          </QueryContainer>
        ),
      },
    },
    allMetrics: {
      definition: { defaultColumnSpan: 2, defaultRowSpan: 2, minColumnSpan: 2, minRowSpan: 2 },
      data: {
        title: "All metrics",
        description: "Revenue and resource count charts",
        content: (
          <QueryContainer minWidth={600} minHeight={300}>
            {() => (
              <TwoColContainer
                left={
                  <QueryContainer minHeight={200}>
                    {({ height = 0 }) => (
                      <SpaceBetween size="xs">
                        <Box fontSize="heading-s" fontWeight="bold">
                          Revenue
                        </Box>
                        <RevenueChart height={height - 200} />
                      </SpaceBetween>
                    )}
                  </QueryContainer>
                }
                right={
                  <QueryContainer>
                    {({ width = 0, height = 0 }) => {
                      let size: "small" | "medium" | "large" = "small";
                      if (width > 300 && height > 300) {
                        size = "medium";
                      }
                      if (width > 450 && height > 500) {
                        size = "large";
                      }
                      return (
                        <SpaceBetween size="s">
                          <Box fontSize="heading-s" fontWeight="bold">
                            Resources
                          </Box>
                          <ResourceCountChart size={size} />
                        </SpaceBetween>
                      );
                    }}
                  </QueryContainer>
                }
              />
            )}
          </QueryContainer>
        ),
      },
    },
    events: {
      definition: { defaultColumnSpan: 2, defaultRowSpan: 1, minColumnSpan: 2, minRowSpan: 1 },
      data: {
        title: "Events",
        description: "Service events table",
        content: (
          <ScrollableContainer height={300} showBorder={false}>
            <EventsTable />
          </ScrollableContainer>
        ),
        footer: (
          <Box textAlign="center">
            <Link href="#">View all events</Link>
          </Box>
        ),
        disableContentPaddings: true,
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
