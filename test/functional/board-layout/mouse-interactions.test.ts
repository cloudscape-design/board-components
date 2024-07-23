// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";

import createWrapper from "../../../lib/components/test-utils/selectors";
import { makeQueryUrl, setupTest } from "../../utils";
import { DndPageObject } from "./dnd-page-object";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();

test(
  "item reorder with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
    await page.dragAndDropTo(
      boardWrapper.findItemById("A").findDragHandle().toSelector(),
      boardWrapper.findItemById("B").findDragHandle().toSelector(),
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["B", "A", "C", "D"],
      ["B", "A", "C", "D"],
      ["E", "F", "G", "H"],
      ["E", "F", "G", "H"],
    ]);
  }),
);

test(
  "item insert with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
    await page.dragAndDropTo(
      itemsPaletteWrapper.findItemById("K").findDragHandle().toSelector(),
      boardWrapper.findItemById("H").findDragHandle().toSelector(),
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["A", "B", "C", "D"],
      ["A", "B", "C", "D"],
      ["E", "F", "G", "K"],
      ["E", "F", "G", "K"],
      [" ", " ", " ", "H"],
      [" ", " ", " ", "H"],
    ]);
  }),
);

test(
  "item resize with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
    await page.dragAndDropTo(
      boardWrapper.findItemById("A").findResizeHandle().toSelector(),
      boardWrapper.findItemById("B").findResizeHandle().toSelector(),
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["A", "A", "C", "D"],
      ["A", "A", "C", "D"],
      ["E", "B", "G", "H"],
      ["E", "B", "G", "H"],
      [" ", "F", " ", " "],
      [" ", "F", " ", " "],
    ]);
  }),
);

test(
  "item resize down to 2x1",
  setupTest(
    makeQueryUrl(
      [
        ["A", "A", " ", " "],
        ["A", "A", " ", " "],
        ["A", "A", " ", " "],
        ["A", "A", " ", " "],
      ],
      [],
    ),
    DndPageObject,
    async (page) => {
      await page.mouseDown(boardWrapper.findItemById("A").findResizeHandle().toSelector());
      await page.mouseMove(-250, -250);
      await page.mouseUp();
      await expect(page.getGrid()).resolves.toEqual([
        ["A", " ", " ", " "],
        ["A", " ", " ", " "],
      ]);
    },
  ),
);

test(
  "can't resize below min row/col span",
  setupTest(
    makeQueryUrl(
      [
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
      ],
      [],
    ),
    DndPageObject,
    async (page) => {
      await page.mouseDown(boardWrapper.findItemById("X").findResizeHandle().toSelector());
      await page.mouseMove(-250, -250);
      await page.mouseUp();
      await expect(page.getGrid()).resolves.toEqual([
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
      ]);
    },
  ),
);

test(
  "no errors in the console when trying to resize below item's baseline",
  setupTest(
    makeQueryUrl(
      [
        ["A", "A", " ", " "],
        ["A", "A", " ", " "],
        ["B", "B", " ", " "],
        ["B", "B", " ", " "],
      ],
      [],
    ),
    DndPageObject,
    async (page) => {
      await page.mouseDown(boardWrapper.findItemById("B").findResizeHandle().toSelector());
      await page.mouseMove(0, -300);
      await page.mouseUp();
      await expect(page.getGrid().then((grid) => grid.map((r) => r.join(" ")).join("\n"))).resolves.toEqual(
        [
          ["A", "A", " ", " "],
          ["A", "A", " ", " "],
          ["B", "B", " ", " "],
          ["B", "B", " ", " "],
        ]
          .map((r) => r.join(" "))
          .join("\n"),
      );
    },
  ),
);
