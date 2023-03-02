// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";
import gridStyles from "../../../lib/components/internal/grid/styles.selectors.js";
import createWrapper from "../../../lib/components/test-utils/selectors";
import { makeQueryUrl, setupTest } from "../../utils";
import { DndPageObject } from "./dnd-page-object";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();
const boardItemResizeHandle = (id: string) => boardWrapper.findItemById(id).findResizeHandle().toSelector();
const paletteItemDragHandle = (id: string) => itemsPaletteWrapper.findItemById(id).findDragHandle().toSelector();

test(
  "for reorder creates extra placeholder rows based on draggable height",
  setupTest(
    makeQueryUrl(
      [
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "B", "G", "H"],
        ["E", "B", "G", "H"],
      ],
      []
    ),
    DndPageObject,
    async (page) => {
      await page.mouseDown(boardWrapper.findItemById("A").findDragHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "B", "G", "H"],
        ["E", "B", "G", "H"],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
      ]);
      await page.mouseUp();

      await page.mouseDown(boardWrapper.findItemById("B").findDragHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "B", "G", "H"],
        ["E", "B", "G", "H"],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
      ]);
    }
  )
);

test(
  "for insert creates extra placeholder rows based on draggable height",
  setupTest(
    makeQueryUrl(
      [
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ],
      ["I", "X"]
    ),
    DndPageObject,
    async (page) => {
      await page.mouseDown(itemsPaletteWrapper.findItemById("I").findDragHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
      ]);
      await page.mouseUp();

      await page.mouseDown(itemsPaletteWrapper.findItemById("X").findDragHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
      ]);
    }
  )
);

test(
  "for resize creates extra placeholder rows when reaching the bottom row",
  setupTest(
    makeQueryUrl(
      [
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        [" ", "F", "G", "H"],
        [" ", "F", "G", "H"],
      ],
      []
    ),
    DndPageObject,
    async (page) => {
      await page.mouseDown(boardWrapper.findItemById("A").findResizeHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        [" ", "F", "G", "H"],
        [" ", "F", "G", "H"],
      ]);

      await page.mouseMove(0, 250);
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["A", "F", "G", "H"],
        ["A", "F", "G", "H"],
        [" ", " ", " ", " "],
      ]);

      await page.mouseMove(0, 100);
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["A", "F", "G", "H"],
        ["A", "F", "G", "H"],
        ["A", " ", " ", " "],
        [" ", " ", " ", " "],
      ]);
    }
  )
);

test(
  "creates extra rows when disturbed item moves partially outside the grid",
  setupTest(
    makeQueryUrl(
      [
        ["A", "A", "A", "B"],
        ["A", "A", "A", "B"],
        ["C", "C", "C", "B"],
        ["C", "C", "C", "B"],
        ["C", "C", "C", "B"],
        ["C", "C", "C", "B"],
        ["D", "D", "E", "E"],
        ["D", "D", "E", "E"],
        ["D", "D", "E", "E"],
        ["D", "D", "E", "E"],
      ],
      []
    ),
    DndPageObject,
    async (page) => {
      const placeholderSelector = `.${gridStyles.default.grid__item}[data-row-span="1"]`;

      await page.setWindowSize({ width: 1600, height: 1800 });
      await expect(page.getElementsCount(placeholderSelector)).resolves.toBe(10 * 4);

      await page.mouseDown(boardWrapper.findItemById("A").findDragHandle().toSelector());
      await expect(page.getElementsCount(placeholderSelector)).resolves.toBe(12 * 4);

      await page.mouseMove(0, 900);
      await expect(page.getElementsCount(placeholderSelector)).resolves.toBe(14 * 4);
    }
  )
);

test(
  "can't resize items below min size with pointer",
  setupTest(
    // X item has min columns = 2 and min rows = 4.
    makeQueryUrl(
      [
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
      ],
      []
    ),
    DndPageObject,
    async (page) => {
      await page.mouseDown(boardWrapper.findItemById("X").findResizeHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        [" ", " ", " ", " "],
      ]);

      await page.mouseMove(-500, -500);
      await expect(page.getGrid()).resolves.toEqual([
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        [" ", " ", " ", " "],
      ]);
    }
  )
);

test(
  "can't resize items below min size with keyboard",
  setupTest(
    // X item has min columns = 2 and min rows = 4.
    makeQueryUrl(
      [
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
      ],
      []
    ),
    DndPageObject,
    async (page) => {
      await page.focus(boardItemResizeHandle("X"));
      await page.keys(["Enter"]);
      await expect(page.getGrid()).resolves.toEqual([
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        ["X", "X", "X", " "],
        [" ", " ", " ", " "],
      ]);

      await page.keys(["ArrowLeft"]);
      await page.keys(["ArrowLeft"]);
      await page.keys(["ArrowUp"]);
      await page.keys(["ArrowUp"]);
      await expect(page.getGrid()).resolves.toEqual([
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        [" ", " ", " ", " "],
      ]);
    }
  )
);

test(
  "always inserts item with default dimensions",
  setupTest(
    makeQueryUrl(
      [],
      // X item has min columns = 2 and min rows = 4.
      ["X"]
    ),
    DndPageObject,
    async (page) => {
      await page.setWindowSize({ width: 800, height: 800 });
      await page.focus(paletteItemDragHandle("X"));
      await page.keys(["Enter"]);
      await page.keys(["ArrowLeft"]);
      await page.keys(["Enter"]);

      await page.setWindowSize({ width: 1600, height: 800 });
      await expect(page.getGrid(4)).resolves.toEqual([
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
        ["X", "X", " ", " "],
      ]);
    }
  )
);

test(
  "uses automatic placement when switching breakpoints",
  setupTest(makeQueryUrl([], ["A", "B", "C", "X"]), DndPageObject, async (page) => {
    async function insertWidget(widgetId: string) {
      await page.focus(paletteItemDragHandle(widgetId));
      await page.keys(["Enter"]);
      await page.keys(["ArrowLeft"]);
      for (let i = 0; i < 10; i++) {
        await page.keys(["ArrowDown"]);
      }
      await page.keys(["Enter"]);
    }

    // Use 1-column layout.
    await page.setWindowSize({ width: 800, height: 800 });
    await insertWidget("A");
    await insertWidget("X");
    await insertWidget("B");
    await insertWidget("C");
    await expect(page.getGrid(1)).resolves.toEqual([
      ["A"],
      ["A"],
      ["X"],
      ["X"],
      ["X"],
      ["X"],
      ["B"],
      ["B"],
      ["C"],
      ["C"],
    ]);

    // Use 2-column layout.
    await page.setWindowSize({ width: 1200, height: 800 });
    await expect(page.getGrid(2)).resolves.toEqual([
      ["A", "X"],
      ["A", "X"],
      ["B", "X"],
      ["B", "X"],
      [" ", "C"],
      [" ", "C"],
    ]);

    // Use 4-column layout.
    await page.setWindowSize({ width: 1600, height: 800 });
    await expect(page.getGrid(4)).resolves.toEqual([
      ["A", "X", "X", "B"],
      ["A", "X", "X", "B"],
      ["C", "X", "X", " "],
      ["C", "X", "X", " "],
    ]);

    // Use 6-column layout.
    await page.setWindowSize({ width: 3000, height: 800 });
    await expect(page.getGrid(6)).resolves.toEqual([
      ["A", "X", "X", "B", "C", " "],
      ["A", "X", "X", "B", "C", " "],
      [" ", "X", "X", " ", " ", " "],
      [" ", "X", "X", " ", " ", " "],
    ]);
  })
);
