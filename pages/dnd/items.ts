// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as awsuiTokens from "@cloudscape-design/design-tokens";

export interface Item {
  id: number;
  color: string;
  columnSpan?: number;
}

export const initialItems: Array<Item> = [
  { id: 1, color: awsuiTokens.colorChartsPaletteCategorical1 },
  { id: 2, columnSpan: 2, color: awsuiTokens.colorChartsPaletteCategorical2 },
  { id: 3, color: awsuiTokens.colorChartsPaletteCategorical3 },
  { id: 4, color: awsuiTokens.colorChartsPaletteCategorical4 },
  { id: 5, color: awsuiTokens.colorChartsPaletteCategorical5 },
  { id: 6, color: awsuiTokens.colorChartsPaletteCategorical6 },
  { id: 7, color: awsuiTokens.colorChartsPaletteCategorical7 },
  { id: 8, color: awsuiTokens.colorChartsPaletteCategorical8 },
  { id: 9, color: awsuiTokens.colorChartsPaletteCategorical9 },
  { id: 10, color: awsuiTokens.colorChartsPaletteCategorical10 },
  { id: 11, color: awsuiTokens.colorChartsPaletteCategorical11 },
  { id: 12, color: awsuiTokens.colorChartsPaletteCategorical12 },
  { id: 13, color: awsuiTokens.colorChartsPaletteCategorical13 },
  { id: 14, color: awsuiTokens.colorChartsPaletteCategorical14 },
  { id: 15, color: awsuiTokens.colorChartsPaletteCategorical15 },
];
