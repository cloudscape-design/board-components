// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { cloneDeep, range } from "lodash";
import { expect, test } from "vitest";
import { applyMove, applyResize, refloatGrid } from "../engine";
import { generateGrid, generateMovePath, generateResize } from "./helpers";

test("input arguments stay unchanged when using engine", () => {
  range(0, 10).forEach(() => {
    const grid = generateGrid();
    const movePath = generateMovePath(grid, "any");
    const resize = generateResize(grid);

    const gridClone = cloneDeep(grid);
    const moveClone = cloneDeep(movePath);

    applyMove(grid, movePath);
    applyResize(grid, resize);
    refloatGrid(grid);

    expect(grid).toEqual(gridClone);
    expect(movePath).toEqual(moveClone);
  });
});
