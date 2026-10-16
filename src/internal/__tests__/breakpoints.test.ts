// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "vitest";

import { resolveContainerColumns } from "../../../lib/components/internal/breakpoints";

describe("resolveContainerColumns", () => {
  test.each([
    [0, 1],
    [687, 1],
    [688, 2],
    [911, 2],
    [912, 4],
    [2099, 4],
    [2100, 6],
  ])("preserves the default layout at %ipx", (width, expectedColumns) => {
    expect(resolveContainerColumns(width)).toBe(expectedColumns);
  });

  test.each([
    [0, 1],
    [688, 1],
    [689, 2],
    [912, 2],
    [913, 4],
    [1320, 4],
    [1321, 8],
    [2400, 8],
  ])("uses responsive column configuration at %ipx", (width, expectedColumns) => {
    expect(resolveContainerColumns(width, { default: 1, xs: 2, s: 4, l: 8 })).toBe(expectedColumns);
  });

  test("uses the default layout below the first configured breakpoint", () => {
    expect(resolveContainerColumns(1200, { l: 8 })).toBe(4);
    expect(resolveContainerColumns(1400, { l: 8 })).toBe(8);
  });

  test("ignores invalid column counts", () => {
    expect(resolveContainerColumns(1400, { default: 1, s: 0, m: -1, l: 2.5 })).toBe(1);
  });
});
