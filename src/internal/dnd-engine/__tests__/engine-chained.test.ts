// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { DndEngine } from "../engine";

test("engine operations can be chained", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);

  const layoutShift = new DndEngine(grid)
    .insert({ id: "X", x: 1, y: 1, width: 1, height: 1 })
    .move({
      itemId: "X",
      path: [
        { x: 1, y: 2 },
        { x: 1, y: 3 },
      ],
    })
    .resize({ itemId: "X", width: 2, height: 1 })
    .remove("F")
    .refloat()
    .getLayoutShift();

  expect(toString(layoutShift.next)).toBe(
    toString([
      ["A", "B", "C"],
      ["D", "E", "E"],
      ["G", "X", "X"],
    ])
  );
});

test("engine operations are not chained when executed separately", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);
  const engine = new DndEngine(grid);

  // These commands are ignored.
  engine.insert({ id: "X", x: 1, y: 1, width: 1, height: 1 });
  engine.move({ itemId: "A", path: [{ x: 0, y: 1 }] });
  engine.resize({ itemId: "A", width: 2, height: 2 });
  engine.remove("A");

  // The last command only is reflected in the layoutShift.
  engine.move({ itemId: "A", path: [{ x: 1, y: 0 }] });

  expect(toString(engine.getLayoutShift().next)).toBe(
    toString([
      ["B", "A", "C"],
      ["D", " ", "F"],
      ["G", "E", "E"],
    ])
  );
});
