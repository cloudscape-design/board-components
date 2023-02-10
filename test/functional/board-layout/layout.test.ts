// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import gridStyles from "../../../lib/components/internal/grid/styles.selectors.js";
import createWrapper from "../../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object.js";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();
const boardItemDragHandle = (id: string) => boardWrapper.findItemById(id).findDragHandle().toSelector();
const boardItemResizeHandle = (id: string) => boardWrapper.findItemById(id).findResizeHandle().toSelector();
const paletteItemDragHandle = (id: string) => itemsPaletteWrapper.findItemById(id).findDragHandle().toSelector();

function makeQueryUrl(layout: string[][], palette: string[]) {
  const query = `layout=${JSON.stringify(layout)}&palette=${JSON.stringify(palette)}`;
  return `/index.html#/dnd/engine-query-test?${query}`;
}

function setupTest(url: string, testFn: (page: DndPageObject, browser: WebdriverIO.Browser) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new DndPageObject(browser);
    await page.setWindowSize({ width: 1200, height: 800 });
    await page.waitForVisible("main");
    await testFn(page, browser);
  });
}

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
    async (page) => {
      const placeholderSelector = `.${gridStyles.default.grid__item}[data-row-span="1"]`;

      await page.setWindowSize({ width: 1200, height: 1800 });
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
  "recovers full layout from 1-column layout when items within one row were swapped",
  setupTest(
    makeQueryUrl(
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
      ],
      []
    ),
    async (page) => {
      await page.setWindowSize({ width: 800, height: 800 });
      await expect(page.getGrid(1)).resolves.toEqual([["A"], ["A"], ["B"], ["B"]]);

      await page.dragAndDropTo(boardItemDragHandle("A"), boardItemDragHandle("B"));
      await expect(page.getGrid(1)).resolves.toEqual([["B"], ["B"], ["A"], ["A"]]);

      await page.setWindowSize({ width: 1200, height: 800 });
      await expect(page.getGrid(4)).resolves.toEqual([
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
      ]);
    }
  )
);

test(
  "recovers full layout from 1-column layout when items between different rows were swapped",
  setupTest(
    makeQueryUrl(
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", "D", "D"],
        ["C", "C", "D", "D"],
      ],
      []
    ),
    async (page) => {
      await page.setWindowSize({ width: 800, height: 800 });
      await expect(page.getGrid(1)).resolves.toEqual([["A"], ["A"], ["B"], ["B"], ["C"], ["C"], ["D"], ["D"]]);

      await page.dragAndDropTo(boardItemDragHandle("A"), boardItemDragHandle("D"));
      await expect(page.getGrid(1)).resolves.toEqual([["B"], ["B"], ["C"], ["C"], ["D"], ["D"], ["A"], ["A"]]);

      await page.setWindowSize({ width: 1200, height: 800 });
      await expect(page.getGrid(4)).resolves.toEqual([
        ["C", "C", "B", "B"],
        ["C", "C", "B", "B"],
        ["A", "A", "D", "D"],
        ["A", "A", "D", "D"],
      ]);
    }
  )
);

test(
  "recovers full layout from 1-column layout when item was resized",
  setupTest(
    makeQueryUrl(
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", " ", " "],
        ["C", "C", " ", " "],
      ],
      []
    ),
    async (page) => {
      await page.setWindowSize({ width: 800, height: 800 });
      await expect(page.getGrid(1)).resolves.toEqual([["A"], ["A"], ["B"], ["B"], ["C"], ["C"]]);

      await page.dragAndDropTo(boardItemResizeHandle("A"), boardItemResizeHandle("B"));
      await expect(page.getGrid(1)).resolves.toEqual([["A"], ["A"], ["A"], ["A"], ["B"], ["B"], ["C"], ["C"]]);

      await page.setWindowSize({ width: 1200, height: 800 });
      await expect(page.getGrid(4)).resolves.toEqual([
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["A", "A", " ", " "],
        ["A", "A", " ", " "],
        ["C", "C", " ", " "],
        ["C", "C", " ", " "],
      ]);
    }
  )
);

test(
  "recovers full layout from 1-column layout when item was removed or added",
  setupTest(
    makeQueryUrl(
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", " ", " "],
        ["C", "C", " ", " "],
      ],
      ["D"]
    ),
    async (page) => {
      await page.setWindowSize({ width: 800, height: 800 });
      await expect(page.getGrid(1)).resolves.toEqual([["A"], ["A"], ["B"], ["B"], ["C"], ["C"]]);

      await page.dragAndDropTo(paletteItemDragHandle("D"), boardItemDragHandle("A"));
      await expect(page.getGrid(1)).resolves.toEqual([["D"], ["D"], ["A"], ["A"], ["B"], ["B"], ["C"], ["C"]]);

      // Remove Widget A.
      await page.focus(boardItemDragHandle("A"));
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);
      await expect(page.getGrid(1)).resolves.toEqual([["D"], ["D"], ["B"], ["B"], ["C"], ["C"]]);

      await page.setWindowSize({ width: 1200, height: 800 });
      await expect(page.getGrid(4)).resolves.toEqual([
        ["D", " ", "B", "B"],
        ["D", " ", "B", "B"],
        ["C", "C", " ", " "],
        ["C", "C", " ", " "],
      ]);
    }
  )
);
