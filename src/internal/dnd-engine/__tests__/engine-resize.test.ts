// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { expect, test } from "vitest";
import { applyResize } from "../engine";
import { createTextGrid, generateGrid, generateResize, stringifyTextGrid } from "./helpers";

test("decrease in element size never issues other element movements", () => {
  range(0, 10).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, 0, grid.width - 1, 0, Math.floor((grid.items.length - 1) % 2) + 1);

    const transition = applyResize(grid, resize);

    expect(transition.moves).toHaveLength(0);
  });
});

test("elements resize never leave grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, grid.width - 1, 0, Math.floor((grid.items.length - 1) % 2) + 1, 0);

    const transition = applyResize(grid, resize);
    const textGrid = createTextGrid(transition.end);

    expect(stringifyTextGrid(textGrid)).not.toContain("/");
  });
});
