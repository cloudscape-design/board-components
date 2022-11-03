// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as awsuiTokens from "@cloudscape-design/design-tokens";
import { DashboardLayoutProps } from "../../lib/components";

export type Item = DashboardLayoutProps.Item<{ color: string }>;

export const initialItems: readonly Item[] = [
  makeItem({ id: 1, columnOffset: 1, color: awsuiTokens.colorChartsPaletteCategorical1 }),
  makeItem({ id: 2, columnOffset: 2, columnSpan: 2, color: awsuiTokens.colorChartsPaletteCategorical2 }),
  makeItem({ id: 3, columnOffset: 4, color: awsuiTokens.colorChartsPaletteCategorical3 }),
  makeItem({ id: 4, columnOffset: 1, color: awsuiTokens.colorChartsPaletteCategorical4 }),
  makeItem({ id: 5, columnOffset: 2, color: awsuiTokens.colorChartsPaletteCategorical5 }),
  makeItem({ id: 6, columnOffset: 3, color: awsuiTokens.colorChartsPaletteCategorical6 }),
  makeItem({ id: 7, columnOffset: 4, color: awsuiTokens.colorChartsPaletteCategorical7 }),
  makeItem({ id: 8, columnOffset: 1, color: awsuiTokens.colorChartsPaletteCategorical8 }),
  makeItem({ id: 9, columnOffset: 2, color: awsuiTokens.colorChartsPaletteCategorical9 }),
  makeItem({ id: 10, columnOffset: 3, color: awsuiTokens.colorChartsPaletteCategorical10 }),
  makeItem({ id: 11, columnOffset: 4, color: awsuiTokens.colorChartsPaletteCategorical11 }),
  makeItem({ id: 12, columnOffset: 1, color: awsuiTokens.colorChartsPaletteCategorical12 }),
  makeItem({ id: 13, columnOffset: 2, color: awsuiTokens.colorChartsPaletteCategorical13 }),
  makeItem({ id: 14, columnOffset: 3, color: awsuiTokens.colorChartsPaletteCategorical14 }),
  makeItem({ id: 15, columnOffset: 4, color: awsuiTokens.colorChartsPaletteCategorical15 }),
];

function makeItem({
  id,
  color,
  columnOffset,
  columnSpan,
}: {
  id: number | string;
  color: string;
  columnOffset: number;
  columnSpan?: number;
}): Item {
  return {
    id: id.toString(),
    data: { color },
    columnOffset,
    columnSpan: columnSpan ?? 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
  };
}
