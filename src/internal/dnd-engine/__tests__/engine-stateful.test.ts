// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { DndEngine } from "../engine";

test("engine keeps its state allowing for command+commit operations", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);
  const engine = new DndEngine(grid);

  engine.insert({ id: "X", x: 1, y: 1, width: 1, height: 1 });
  engine.commit();
  expect(printResult(engine)).toBe(
    toString([
      ["A", "B", "C"],
      ["D", "X", "F"],
      ["G", "E", "E"],
    ])
  );

  engine.move({
    itemId: "X",
    path: [
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ],
  });
  engine.commit();
  expect(printResult(engine)).toBe(
    toString([
      ["A", "B", "C"],
      ["D", " ", "F"],
      ["G", "E", "E"],
      [" ", "X", " "],
    ])
  );

  engine.resize({ itemId: "X", width: 2, height: 1 });
  engine.commit();
  expect(printResult(engine)).toBe(
    toString([
      ["A", "B", "C"],
      ["D", " ", "F"],
      ["G", "E", "E"],
      [" ", "X", "X"],
    ])
  );

  engine.remove("F");
  engine.commit();
  expect(printResult(engine)).toBe(
    toString([
      ["A", "B", "C"],
      ["D", "E", "E"],
      ["G", "X", "X"],
    ])
  );
});

test("engine commands start from the last committed state", () => {
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

  expect(printResult(engine)).toBe(
    toString([
      ["B", "A", "C"],
      ["D", " ", "F"],
      ["G", "E", "E"],
    ])
  );
});

test("commit does not happen when grid has unresolved conflicts", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);
  const engine = new DndEngine(grid);

  // The commit does not happen because the grid has conflicts as result of the move.
  engine.move({ itemId: "G", path: [{ x: 1, y: 2 }] });
  engine.commit();

  // This commit happens.
  engine.move({ itemId: "A", path: [{ x: 1, y: 0 }] });
  engine.commit();

  expect(printResult(engine)).toBe(
    toString([
      ["B", "A", "C"],
      ["D", " ", "F"],
      ["G", "E", "E"],
    ])
  );
});

function printResult(engine: DndEngine): string {
  return toString(engine.getLayoutShift().next);
}
