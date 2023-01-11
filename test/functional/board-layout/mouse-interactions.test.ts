// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object.js";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();

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
  "item reorder with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.dragAndDropTo(
      boardWrapper.findItemById("A").findDragHandle().toSelector(),
      boardWrapper.findItemById("B").findDragHandle().toSelector()
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["B", "A", "C", "D"],
      ["B", "A", "C", "D"],
      ["E", "F", "G", "H"],
      ["E", "F", "G", "H"],
    ]);
  })
);

test(
  "item insert with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.dragAndDropTo(
      itemsPaletteWrapper.findItemById("K").findDragHandle().toSelector(),
      boardWrapper.findItemById("H").findDragHandle().toSelector()
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["A", "B", "C", "D"],
      ["A", "B", "C", "D"],
      ["E", "F", "G", "K"],
      ["E", "F", "G", "K"],
      [" ", " ", " ", "H"],
      [" ", " ", " ", "H"],
    ]);
  })
);

test(
  "item resize with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.dragAndDropTo(
      boardWrapper.findItemById("A").findResizeHandle().toSelector(),
      boardWrapper.findItemById("B").findResizeHandle().toSelector()
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["A", "A", "B", "C"],
      ["A", "A", "B", "C"],
      ["E", "F", "G", "D"],
      ["E", "F", "G", "D"],
      [" ", " ", " ", "H"],
      [" ", " ", " ", "H"],
    ]);
  })
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
      []
    ),
    async (page) => {
      await page.mouseDown(boardWrapper.findItemById("A").findResizeHandle().toSelector());
      await page.mouseMove(-250, -250);
      await page.mouseUp();
      await expect(page.getGrid()).resolves.toEqual([
        ["A", " ", " ", " "],
        ["A", " ", " ", " "],
      ]);
    }
  )
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
      []
    ),
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
    }
  )
);
