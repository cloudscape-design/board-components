// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import { expect, test } from "vitest";
import createWrapper from "../../lib/components/test-utils/selectors";
import { setupTest } from "../setup-test";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();
const boardItemHandle = (id: string) => boardWrapper.findItemById(id).findDragHandle().toSelector();
const boardItemResizeHandle = (id: string) => boardWrapper.findItemById(id).findResizeHandle().toSelector();

class DndPageObject extends ScreenshotPageObject {
  async focus(selector: string) {
    await this.browser.execute((target) => {
      (document.querySelector(target) as HTMLButtonElement)!.focus();
    }, selector);
  }

  async getElementCenter(selector: string) {
    const targetRect = await this.getBoundingBox(selector);
    const x = Math.round(targetRect.left + targetRect.width / 2);
    const y = Math.round(targetRect.top + targetRect.height / 2);
    return { x, y };
  }

  async mouseDown(selector: string) {
    const center = await this.getElementCenter(selector);
    await (await this.browser.$(selector)).moveTo();
    await this.browser.performActions([
      {
        type: "pointer",
        id: "event",
        parameters: { pointerType: "mouse" },
        actions: [
          { type: "pointerMove", duration: 0, origin: "pointer", ...center },
          { type: "pointerDown", button: 0 },
          { type: "pause", duration: 10 },
        ],
      },
    ]);
  }

  async mouseMove(xOffset: number, yOffset: number) {
    await this.browser.performActions([
      {
        type: "pointer",
        id: "event",
        parameters: { pointerType: "mouse" },
        actions: [
          { type: "pointerMove", duration: 100, origin: "pointer", x: xOffset, y: yOffset },
          { type: "pause", duration: 10 },
          { type: "pointerMove", duration: 10, origin: "pointer", x: 1, y: 1 },
          { type: "pause", duration: 10 },
          { type: "pointerMove", duration: 10, origin: "pointer", x: -1, y: -1 },
          { type: "pause", duration: 10 },
        ],
      },
    ]);
  }

  async mouseUp() {
    await this.browser.performActions([
      {
        type: "pointer",
        id: "event",
        parameters: { pointerType: "mouse" },
        actions: [
          { type: "pointerUp", button: 0 },
          { type: "pause", duration: 10 },
        ],
      },
    ]);
  }

  async fullPageScreenshot() {
    // Necessary for animations to complete.
    await this.pause(100);
    return super.fullPageScreenshot();
  }
}

function makeQueryUrl(layout: string[][], palette: string[]) {
  const query = `layout=${JSON.stringify(layout)}&palette=${JSON.stringify(palette)}`;
  return `/index.html#/dnd/engine-query-test?${query}`;
}

test(
  "active item overlays other items",
  setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
    await page.focus(boardItemHandle("A"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowDown"]);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);

test(
  "resizes 4x2 item down to 2x1 one step at a time",
  setupTest(
    makeQueryUrl(
      [
        ["A", "A", "B", "C"],
        ["A", "A", "B", "C"],
        ["A", "A", "D", "E"],
        ["A", "A", "D", "E"],
        ["F", "G", " ", " "],
        ["F", "G", " ", " "],
      ],
      []
    ),
    DndPageObject,
    async (page) => {
      await page.focus(boardItemResizeHandle("A"));
      await page.keys(["Enter"]);
      await page.keys(["ArrowLeft"]);
      expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

      await page.keys(["ArrowUp"]);
      await page.keys(["ArrowUp"]);
      expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

      await page.keys(["Enter"]);
      expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
    }
  )
);

test(
  "palette item size remains the same after drag start",
  setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
    await page.mouseDown(itemsPaletteWrapper.findItemById("L").findDragHandle().toSelector());
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    await page.mouseUp();
    await page.windowScrollTo({ top: 600 });

    await page.mouseDown(itemsPaletteWrapper.findItemById("Q").findDragHandle().toSelector());
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);

test(
  "palette item size adjusts to board item size when moved over board",
  setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
    await page.mouseDown(itemsPaletteWrapper.findItemById("K").findDragHandle().toSelector());
    await page.mouseMove(-200, 0);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    await page.mouseMove(200, 0);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);

test(
  "palette item with min colspan=2 can be inserted into 1-column layout",
  setupTest("/index.html#/dnd/engine-a2p-test", DndPageObject, async (page) => {
    await page.setWindowSize({ width: 800, height: 800 });

    await page.focus(itemsPaletteWrapper.findItemById("R").findDragHandle().toSelector());
    await page.keys(["Enter"]);

    await page.keys(["ArrowLeft"]);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    await page.keys(["Enter"]);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);

test(
  "split-panel prevents collisions when inserting an item from the palette at the bottom",
  setupTest("/index.html#/with-app-layout/integ", DndPageObject, async (page) => {
    await page.setWindowSize({ width: 600, height: 800 });

    await page.click(`[data-testid="add-widget"]`);

    await page.mouseDown(itemsPaletteWrapper.findItemById("counter").findDragHandle().toSelector());
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    await page.mouseMove(0, -400);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);

test(
  "collisions disabled when item moves outside the board",
  setupTest("/index.html#/with-app-layout/integ", DndPageObject, async (page) => {
    await page.setWindowSize({ width: 2200, height: 800 });

    // Moving item to the left but it still touches the board.
    await page.mouseDown(boardWrapper.findItemById("D").findDragHandle().toSelector());
    await page.mouseMove(-250, 0);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    // Moving item further to the left so that it leaves the board.
    await page.mouseMove(-150, 0);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);
