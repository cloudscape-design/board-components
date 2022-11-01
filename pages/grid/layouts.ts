// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { GridLayoutItem } from "../../lib/components/internal/layout";

function generate<T>(amount: number, factory: (index: number) => T) {
  return new Array(amount).fill(0).map((_, index) => factory(index));
}

type GridLayoutItemSize = Omit<GridLayoutItem, "id" | "columnOffset" | "rowOffset">;

const chessTemplate: GridLayoutItemSize = {
  columnSpan: 1,
  rowSpan: 1,
};

export const chess: GridLayoutItem[] = [
  ...generate(4, (index) => ({ ...chessTemplate, columnOffset: index + 1, id: `a-${index}`, rowOffset: 1 })),
  ...generate(4, (index) => ({ ...chessTemplate, columnOffset: index + 1, id: `b-${index}`, rowOffset: 2 })),
  ...generate(4, (index) => ({ ...chessTemplate, columnOffset: index + 1, id: `c-${index}`, rowOffset: 3 })),
  ...generate(4, (index) => ({ ...chessTemplate, columnOffset: index + 1, id: `d-${index}`, rowOffset: 4 })),
];

const jengaSmallTemplate: GridLayoutItemSize = {
  columnSpan: 1,
  rowSpan: 1,
};

const jengaMediumTemplate: GridLayoutItemSize = {
  columnSpan: 2,
  rowSpan: 1,
};

const jengaLargeTemplate: GridLayoutItemSize = {
  columnSpan: 4,
  rowSpan: 1,
};

export const jenga: GridLayoutItem[] = [
  { ...jengaSmallTemplate, id: "small-1", columnOffset: 4, rowOffset: 1 },
  { ...jengaSmallTemplate, id: "small-2", columnOffset: 4, rowOffset: 2 },
  { ...jengaMediumTemplate, id: "medium-2", columnOffset: 3, rowOffset: 3 },
  { ...jengaLargeTemplate, id: "large-1", columnOffset: 1, rowOffset: 4 },
  { ...jengaSmallTemplate, id: "small-3", columnOffset: 1, rowOffset: 5 },
  { ...jengaSmallTemplate, id: "small-4", columnOffset: 4, rowOffset: 5 },
];

const crossTemplate: GridLayoutItemSize = {
  columnSpan: 1,
  rowSpan: 1,
};

export const cross: GridLayoutItem[] = [
  { ...crossTemplate, id: "1-1", columnOffset: 1, rowOffset: 1 },
  { ...crossTemplate, id: "1-4", columnOffset: 4, rowOffset: 1 },
  { ...crossTemplate, id: "2-2", columnOffset: 2, rowOffset: 2 },
  { ...crossTemplate, id: "2-3", columnOffset: 3, rowOffset: 2 },
  { ...crossTemplate, id: "3-2", columnOffset: 2, rowOffset: 3 },
  { ...crossTemplate, id: "3-3", columnOffset: 3, rowOffset: 3 },
  { ...crossTemplate, id: "4-1", columnOffset: 1, rowOffset: 4 },
  { ...crossTemplate, id: "4-4", columnOffset: 4, rowOffset: 4 },
];

export const dashboard: GridLayoutItem[] = [
  { id: "extralarge-1", columnOffset: 0, columnSpan: 4, rowSpan: 1, rowOffset: 1 },
  { id: "large-1", columnOffset: 0, columnSpan: 3, rowSpan: 3, rowOffset: 2 },
  { id: "small-1", columnOffset: 4, columnSpan: 1, rowSpan: 3, rowOffset: 2 },
  { id: "medium-1", columnOffset: 0, columnSpan: 2, rowSpan: 3, rowOffset: 5 },
  { id: "medium-2", columnOffset: 0, columnSpan: 2, rowSpan: 3, rowOffset: 5 },
  { id: "small-2", columnOffset: 0, columnSpan: 1, rowSpan: 3, rowOffset: 8 },
  { id: "medium-3", columnOffset: 2, columnSpan: 2, rowSpan: 3, rowOffset: 8 },
  { id: "medium-4", columnOffset: 0, columnSpan: 2, rowSpan: 6, rowOffset: 11 },
];
