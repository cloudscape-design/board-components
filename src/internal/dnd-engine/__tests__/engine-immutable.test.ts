// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range, cloneDeep } from "lodash";
import { expect, test } from "vitest";
import { applyMove } from "../engine";
import { generateGrid, generateMovePath } from "./helpers";

test("input arguments stay unchanged", () => {
  range(0, 10).forEach(() => {
    const grid = generateGrid();
    const movePath = generateMovePath(grid, "any");

    const gridClone = cloneDeep(grid);
    const moveClone = cloneDeep(movePath);

    applyMove(grid, movePath);

    expect(grid).toEqual(gridClone);
    expect(movePath).toEqual(moveClone);
  });
});
