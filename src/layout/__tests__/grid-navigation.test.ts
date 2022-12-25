// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { fromMatrix } from "../../internal/debug-tools";
import { GridLayout, GridLayoutItem, ItemId } from "../../internal/interfaces";
import { getNextItem } from "../calculations/grid-navigation";

function get(layout: GridLayout, id: ItemId): GridLayoutItem {
  return layout.items.find((item) => item.id === id)!;
}

test("getNextItem returns null when on the edge", () => {
  const layout = fromMatrix([
    ["A", "B"],
    ["C", "D"],
  ]);

  expect(getNextItem(layout, get(layout, "A"), "left")).toBe(null);
  expect(getNextItem(layout, get(layout, "B"), "right")).toBe(null);
  expect(getNextItem(layout, get(layout, "A"), "up")).toBe(null);
  expect(getNextItem(layout, get(layout, "D"), "down")).toBe(null);
});

test("getNextItem returns adjacent item", () => {
  const layout = fromMatrix([
    ["A", "B"],
    ["C", "D"],
  ]);

  expect(getNextItem(layout, get(layout, "A"), "right")).toBe(get(layout, "B"));
  expect(getNextItem(layout, get(layout, "B"), "left")).toBe(get(layout, "A"));
  expect(getNextItem(layout, get(layout, "A"), "down")).toBe(get(layout, "C"));
  expect(getNextItem(layout, get(layout, "D"), "up")).toBe(get(layout, "B"));
});

test("getNextItem returns partially adjacent item", () => {
  const layout = fromMatrix([
    ["A", "A", "C"],
    [" ", "B", "C"],
  ]);

  expect(getNextItem(layout, get(layout, "A"), "down")).toBe(get(layout, "B"));
  expect(getNextItem(layout, get(layout, "B"), "right")).toBe(get(layout, "C"));
});
