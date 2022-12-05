// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { cloneDeep } from "lodash";
import { expect, test } from "vitest";
import { generateGrid, generateMove, generateResize } from "../../debug-tools";
import { LayoutEngine } from "../engine";

test("input arguments stay unchanged when using engine", () => {
  const grid = generateGrid();
  const movePath = generateMove(grid, "any");
  const resize = generateResize(grid);

  const gridClone = cloneDeep(grid);
  const moveClone = cloneDeep(movePath);

  new LayoutEngine(grid).move(movePath);
  new LayoutEngine(grid).resize(resize);
  new LayoutEngine(grid).insert({ itemId: "X", width: 1, height: 1, path: [{ x: 0, y: 0 }] });
  new LayoutEngine(grid).remove("A");
  new LayoutEngine(grid).refloat();

  expect(grid).toEqual(gridClone);
  expect(movePath).toEqual(moveClone);
});
