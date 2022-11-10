// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { GridLayoutItem } from "../../lib/components/internal/base-types";

function generate<T>(amount: number, factory: (index: number) => T) {
  return new Array(amount).fill(0).map((_, index) => factory(index));
}

interface GridLayoutItemSize {
  width: number;
  height: number;
}

const chessTemplate: GridLayoutItemSize = {
  width: 1,
  height: 1,
};

export const chess: GridLayoutItem[] = [
  ...generate(4, (index) => ({ ...chessTemplate, x: index + 1, id: `a-${index}`, y: 1 })),
  ...generate(4, (index) => ({ ...chessTemplate, x: index + 1, id: `b-${index}`, y: 2 })),
  ...generate(4, (index) => ({ ...chessTemplate, x: index + 1, id: `c-${index}`, y: 3 })),
  ...generate(4, (index) => ({ ...chessTemplate, x: index + 1, id: `d-${index}`, y: 4 })),
];

const jengaSmallTemplate: GridLayoutItemSize = {
  width: 1,
  height: 1,
};

const jengaMediumTemplate: GridLayoutItemSize = {
  width: 2,
  height: 1,
};

const jengaLargeTemplate: GridLayoutItemSize = {
  width: 4,
  height: 1,
};

export const jenga: GridLayoutItem[] = [
  { ...jengaSmallTemplate, id: "small-1", x: 4, y: 1 },
  { ...jengaSmallTemplate, id: "small-2", x: 4, y: 2 },
  { ...jengaMediumTemplate, id: "medium-2", x: 3, y: 3 },
  { ...jengaLargeTemplate, id: "large-1", x: 1, y: 4 },
  { ...jengaSmallTemplate, id: "small-3", x: 1, y: 5 },
  { ...jengaSmallTemplate, id: "small-4", x: 4, y: 5 },
];

const crossTemplate: GridLayoutItemSize = {
  width: 1,
  height: 1,
};

export const cross: GridLayoutItem[] = [
  { ...crossTemplate, id: "1-1", x: 1, y: 1 },
  { ...crossTemplate, id: "1-4", x: 4, y: 1 },
  { ...crossTemplate, id: "2-2", x: 2, y: 2 },
  { ...crossTemplate, id: "2-3", x: 3, y: 2 },
  { ...crossTemplate, id: "3-2", x: 2, y: 3 },
  { ...crossTemplate, id: "3-3", x: 3, y: 3 },
  { ...crossTemplate, id: "4-1", x: 1, y: 4 },
  { ...crossTemplate, id: "4-4", x: 4, y: 4 },
];

export const dashboard: GridLayoutItem[] = [
  { id: "extralarge-1", x: 0, width: 4, height: 1, y: 1 },
  { id: "large-1", x: 0, width: 3, height: 3, y: 2 },
  { id: "small-1", x: 4, width: 1, height: 3, y: 2 },
  { id: "medium-1", x: 0, width: 2, height: 3, y: 5 },
  { id: "medium-2", x: 0, width: 2, height: 3, y: 5 },
  { id: "small-2", x: 0, width: 1, height: 3, y: 8 },
  { id: "medium-3", x: 2, width: 2, height: 3, y: 8 },
  { id: "medium-4", x: 0, width: 2, height: 6, y: 11 },
];
