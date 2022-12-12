// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object.js";

const dashboardWrapper = createWrapper().findDashboard();
const paletteWrapper = createWrapper().findPalette();

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
        ["E", "B", "G", "H"],
      ],
      []
    ),
    async (page) => {
      await page.mouseDown(dashboardWrapper.findItemById("A").findDragHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["E", "B", "G", "H"],
        [" ", " ", " ", " "],
      ]);
      await page.mouseUp();

      await page.mouseDown(dashboardWrapper.findItemById("B").findDragHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["E", "B", "G", "H"],
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
        ["E", "F", "G", "H"],
      ],
      ["I", "X"]
    ),
    async (page) => {
      await page.mouseDown(paletteWrapper.findItemById("I").findDragHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        [" ", " ", " ", " "],
      ]);
      await page.mouseUp();

      await page.mouseDown(paletteWrapper.findItemById("X").findDragHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
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
        [" ", "F", "G", "H"],
      ],
      []
    ),
    async (page) => {
      await page.mouseDown(dashboardWrapper.findItemById("A").findResizeHandle().toSelector());
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        [" ", "F", "G", "H"],
      ]);

      await page.mouseMove(0, 250);
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        [" ", "F", "G", "H"],
        [" ", " ", " ", " "],
      ]);

      await page.mouseMove(0, 250);
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        [" ", "F", "G", "H"],
        [" ", " ", " ", " "],
        [" ", " ", " ", " "],
      ]);
    }
  )
);

test(
  "palette item size remains the same after drag start",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.mouseDown(paletteWrapper.findItemById("L").findDragHandle().toSelector());
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    await page.mouseUp();
    await page.windowScrollTo({ top: 600 });

    await page.mouseDown(paletteWrapper.findItemById("Q").findDragHandle().toSelector());
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);

test(
  "palette item size adjusts to dashboard item size when moved over dashboard",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.mouseDown(paletteWrapper.findItemById("K").findDragHandle().toSelector());
    await page.mouseMove(-200, 0);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    await page.mouseMove(200, 0);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);
