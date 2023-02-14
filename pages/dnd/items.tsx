// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Box, Link, SpaceBetween } from "@cloudscape-design/components";
import { BoardProps, ItemsPaletteProps } from "../../lib/components";
import { fromMatrix } from "../../lib/components/internal/debug-tools";
import { BoardItemDefinition, BoardItemDefinitionBase } from "../../lib/components/internal/interfaces";
import { GridLayout } from "../../lib/components/internal/interfaces";
import { ItemData } from "../shared/interfaces";
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

export type ItemWidgets = Record<
  string,
  { data: ItemData; definition?: ItemsPaletteProps.Item["definition"] } | undefined
>;

const createDefaultWidget = (id: string) => ({
  title: `Widget ${id}`,
  description: "Dummy description",
  content: <DefaultContainer>Dummy content</DefaultContainer>,
});

export const demoWidgets: ItemWidgets = {
  D: {
    definition: { defaultColumnSpan: 2, defaultRowSpan: 4, minRowSpan: 4 },
    data: {
      title: "Demo widget",
      description: "Most minimal widget",
      content: <DefaultContainer>My minimal row span is 4.</DefaultContainer>,
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

export const demoLayoutItems: readonly BoardProps.Item<ItemData>[] = storedPositions.map((pos) => {
  const config = demoWidgets[pos.id];
  return {
    ...pos,
    data: config?.data ?? createDefaultWidget(pos.id),
    definition: config?.definition,
  };
});

export const demoPaletteItems: readonly ItemsPaletteProps.Item<ItemData>[] = Object.entries(demoWidgets)
  .filter(([key]) => !storedPositions.find((pos) => pos.id === key))
  .map(([key, widget]) => ({
    id: key,
    definition: widget?.definition,
    data: widget?.data ?? createDefaultWidget(key),
  }));

export const letterWidgets = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].reduce((acc, letter) => {
  const definitions: { [letter: string]: BoardItemDefinitionBase["definition"] } = {
    R: { defaultRowSpan: 1, defaultColumnSpan: 2, minRowSpan: 1, minColumnSpan: 2 },
    S: { defaultRowSpan: 1, defaultColumnSpan: 2, minRowSpan: 1, minColumnSpan: 2 },
    T: { defaultRowSpan: 1, defaultColumnSpan: 2, minRowSpan: 1, minColumnSpan: 2 },
    U: { defaultRowSpan: 4, defaultColumnSpan: 1, minRowSpan: 4, minColumnSpan: 1 },
    V: { defaultRowSpan: 4, defaultColumnSpan: 1, minRowSpan: 4, minColumnSpan: 1 },
    W: { defaultRowSpan: 4, defaultColumnSpan: 1, minRowSpan: 4, minColumnSpan: 1 },
    X: { defaultRowSpan: 4, defaultColumnSpan: 2, minRowSpan: 4, minColumnSpan: 2 },
    Y: { defaultRowSpan: 4, defaultColumnSpan: 2, minRowSpan: 4, minColumnSpan: 2 },
    Z: { defaultRowSpan: 4, defaultColumnSpan: 2, minRowSpan: 4, minColumnSpan: 2 },
  };
  acc[letter] = {
    id: letter,
    definition: definitions[letter],
    data: {
      title: `Widget ${letter}`,
      description: "Empty widget",
      content: "",
    },
  };
  return acc;
}, {} as { [id: string]: BoardItemDefinitionBase<ItemData> });

export function createLetterItems(grid: null | string[][], palette?: string[]) {
  if (!grid) {
    return null;
  }

  const layoutItems = applyLayout(fromMatrix(grid), Object.values(letterWidgets));

  const usedLetterItems = new Set(layoutItems.map((item) => item.id));
  const paletteItems = Object.values(letterWidgets).filter(
    (item) => !usedLetterItems.has(item.id) && (!palette || palette.includes(item.id))
  );

  return { layoutItems, paletteItems };
}

function applyLayout<D>(
  layout: GridLayout,
  sourceItems: readonly (BoardItemDefinitionBase<D> | BoardItemDefinition<D>)[]
): readonly BoardItemDefinition<D>[] {
  const itemById = new Map(sourceItems.map((item) => [item.id, item]));
  const getItem = (itemId: string) => {
    const item = itemById.get(itemId);
    if (!item) {
      throw new Error("Invariant violation: no matching source item found.");
    }
    return item;
  };

  const sortedLayout = layout.items.slice().sort((a, b) => {
    if (a.y !== b.y) {
      return a.y > b.y ? 1 : -1;
    }
    return a.x > b.x ? 1 : -1;
  });

  return sortedLayout.map(({ id, x, width, height }) => ({
    ...getItem(id),
    columnOffset: x,
    columnSpan: width,
    rowSpan: height,
  }));
}
