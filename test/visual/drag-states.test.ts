// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import createWrapper from "../../lib/components/test-utils/selectors";
import { makeQueryUrl } from "../utils";
import { setupScreenshotTest } from "./utils";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();
const boardItemHandle = (id: string) => boardWrapper.findItemById(id).findDragHandle().toSelector();
const boardItemResizeHandle = (id: string) => boardWrapper.findItemById(id).findResizeHandle().toSelector();

test(
  "drag-states/renders correctly styled focus ring around the drag handle",
  setupScreenshotTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(boardItemHandle("A"));
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  }),
);

test(
  "drag-states/renders correctly styled focus ring around the resize handle",
  setupScreenshotTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(boardItemResizeHandle("A"));
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  }),
);

test(
  "drag-states/active item overlays other items",
  setupScreenshotTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(boardItemHandle("A"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowDown"]);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  }),
);

for (let i = 1; i <= 3; i++) {
  test(
    `drag-states/resizes 4x2 item down to 2x1 one step at a time ${i}`,
    setupScreenshotTest(
      makeQueryUrl(
        [
          ["A", "A", "B", "C"],
          ["A", "A", "B", "C"],
          ["A", "A", "D", "E"],
          ["A", "A", "D", "E"],
          ["F", "G", " ", " "],
          ["F", "G", " ", " "],
        ],
        [],
      ),

      async (page) => {
        await page.focus(boardItemResizeHandle("A"));
        await page.keys(["Enter"]);
        await page.keys(["ArrowLeft"]);
        i === 1 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

        await page.keys(["ArrowUp"]);
        await page.keys(["ArrowUp"]);
        i === 2 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

        await page.keys(["Enter"]);
        i === 3 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
      },
    ),
  );
}

for (let i = 1; i <= 2; i++) {
  test(
    `drag-states/palette item size remains the same after drag start ${i}`,
    setupScreenshotTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.mouseDown(itemsPaletteWrapper.findItemById("L").findDragHandle().toSelector());
      i === 1 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

      await page.mouseUp();
      await page.windowScrollTo({ top: 600 });

      await page.mouseDown(itemsPaletteWrapper.findItemById("Q").findDragHandle().toSelector());
      i === 2 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
    }),
  );
}

for (let i = 1; i <= 2; i++) {
  test(
    `drag-states/palette item size adjusts to board item size when moved over board ${i}`,
    setupScreenshotTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.mouseDown(itemsPaletteWrapper.findItemById("K").findDragHandle().toSelector());
      await page.mouseMove(-200, 0);
      i === 1 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

      await page.mouseMove(200, 0);
      i === 2 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
    }),
  );
}

for (let i = 1; i <= 2; i++) {
  test(
    `drag-states/palette item with min colspan=2 can be inserted into 1-column layout ${i}`,
    setupScreenshotTest("/index.html#/dnd/engine-a2p-test", async (page) => {
      await page.setWindowSize({ width: 800, height: 800 });

      await page.focus(itemsPaletteWrapper.findItemById("R").findDragHandle().toSelector());
      await page.keys(["Enter"]);

      await page.keys(["ArrowLeft"]);
      i === 1 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

      await page.keys(["Enter"]);
      i === 2 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
    }),
  );
}

for (let i = 1; i <= 2; i++) {
  test(
    `drag-states/split-panel prevents collisions when inserting an item from the palette at the bottom ${i}`,
    setupScreenshotTest("/index.html#/with-app-layout/integ", async (page) => {
      await page.setWindowSize({ width: 600, height: 800 });

      await page.click(`[data-testid="add-widget"]`);

      await page.mouseDown(itemsPaletteWrapper.findItemById("counter").findDragHandle().toSelector());
      i === 1 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

      await page.mouseMove(0, -400);
      i === 2 && expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
    }),
  );
}
