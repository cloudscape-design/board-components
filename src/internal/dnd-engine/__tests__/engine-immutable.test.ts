// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { cloneDeep } from "lodash";
import { expect, test } from "vitest";
import { generateGrid, generateMove, generateResize } from "../debug-tools";
import { DndEngine } from "../engine";

test("input arguments stay unchanged when using engine", () => {
  const grid = generateGrid();
  const movePath = generateMove(grid, "any");
  const resize = generateResize(grid);

  const gridClone = cloneDeep(grid);
  const moveClone = cloneDeep(movePath);

  new DndEngine(grid).move(movePath);
  new DndEngine(grid).resize(resize);
  new DndEngine(grid).insert({ id: "X", x: 0, y: 0, width: 1, height: 1 });
  new DndEngine(grid).remove("A");
  new DndEngine(grid).commit();

  expect(grid).toEqual(gridClone);
  expect(movePath).toEqual(moveClone);
});
