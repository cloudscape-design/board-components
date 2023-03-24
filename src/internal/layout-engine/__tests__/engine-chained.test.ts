// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { Position } from "../../utils/position";
import { LayoutEngine } from "../engine";

test("engine operations can be chained", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);

  const layoutShift = new LayoutEngine(grid)
    .insert({ itemId: "X", width: 1, height: 1, path: [new Position({ x: 1, y: 1 })] })
    .move({
      itemId: "X",
      path: [new Position({ x: 1, y: 2 }), new Position({ x: 1, y: 3 })],
    })
    .resize({ itemId: "X", path: [new Position({ x: 3, y: 4 })] })
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
  const engine = new LayoutEngine(grid);

  // These commands are ignored.
  engine.insert({ itemId: "X", width: 1, height: 1, path: [new Position({ x: 1, y: 1 })] });
  engine.move({ itemId: "A", path: [new Position({ x: 0, y: 1 })] });
  engine.resize({ itemId: "A", path: [new Position({ x: 2, y: 1 })] });
  engine.remove("A");

  // The last command only is reflected in the layoutShift.
  engine.move({ itemId: "A", path: [new Position({ x: 1, y: 0 })] });

  expect(toString(engine.getLayoutShift().next)).toBe(
    toString([
      ["B", "A", "C"],
      ["D", " ", "F"],
      ["G", "E", "E"],
    ])
  );
});
