// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { GridLayoutItem } from "../../lib/components/internal/interfaces";

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
  ...generate(4, (index) => ({ ...chessTemplate, x: index, id: `a-${index}`, y: 0 })),
  ...generate(4, (index) => ({ ...chessTemplate, x: index, id: `b-${index}`, y: 1 })),
  ...generate(4, (index) => ({ ...chessTemplate, x: index, id: `c-${index}`, y: 2 })),
  ...generate(4, (index) => ({ ...chessTemplate, x: index, id: `d-${index}`, y: 3 })),
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
  { ...jengaSmallTemplate, id: "small-1", x: 3, y: 0 },
  { ...jengaSmallTemplate, id: "small-2", x: 3, y: 1 },
  { ...jengaMediumTemplate, id: "medium-2", x: 2, y: 2 },
  { ...jengaLargeTemplate, id: "large-1", x: 0, y: 3 },
  { ...jengaSmallTemplate, id: "small-3", x: 0, y: 4 },
  { ...jengaSmallTemplate, id: "small-4", x: 3, y: 4 },
];

const crossTemplate: GridLayoutItemSize = {
  width: 1,
  height: 1,
};

export const cross: GridLayoutItem[] = [
  { ...crossTemplate, id: "1-1", x: 0, y: 0 },
  { ...crossTemplate, id: "1-4", x: 3, y: 0 },
  { ...crossTemplate, id: "2-2", x: 1, y: 1 },
  { ...crossTemplate, id: "2-3", x: 2, y: 1 },
  { ...crossTemplate, id: "3-2", x: 1, y: 2 },
  { ...crossTemplate, id: "3-3", x: 2, y: 2 },
  { ...crossTemplate, id: "4-1", x: 0, y: 3 },
  { ...crossTemplate, id: "4-4", x: 3, y: 3 },
];

export const board: GridLayoutItem[] = [
  { id: "extralarge-1", x: 0, width: 4, height: 1, y: 0 },
  { id: "large-1", x: 0, width: 3, height: 3, y: 1 },
  { id: "small-1", x: 3, width: 1, height: 3, y: 1 },
  { id: "medium-1", x: 0, width: 2, height: 3, y: 4 },
  { id: "medium-2", x: 2, width: 2, height: 3, y: 4 },
  { id: "small-2", x: 0, width: 1, height: 3, y: 7 },
  { id: "medium-3", x: 1, width: 2, height: 3, y: 7 },
  { id: "medium-4", x: 0, width: 2, height: 6, y: 10 },
];
