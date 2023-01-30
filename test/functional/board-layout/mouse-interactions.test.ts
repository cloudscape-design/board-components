// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object.js";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();
const paletteItemHandle = (id: string) => itemsPaletteWrapper.findItemById(id).findDragHandle().toSelector();

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
  "can resize item with fixed elements inside",
  setupTest("index.html#/with-app-layout/integ", async (page) => {
    // Add "events" widget that has a table as contents.
    await page.click('[data-testid="add-widget"]');
    await page.focus(paletteItemHandle("events"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowLeft", "ArrowUp", "ArrowUp", "ArrowUp"]);
    await page.keys(["Enter"]);
    await expect(page.getWidgetSize("events")).resolves.toHaveLength(4);

    await page.dragAndDropTo(
      boardWrapper.findItemById("events").findResizeHandle().toSelector(),
      boardWrapper.findItemById("3").findResizeHandle().toSelector()
    );
    await expect(page.getWidgetSize("events")).resolves.toHaveLength(8);
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
      []
    ),
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
          .join("\n")
      );
    }
  )
);
