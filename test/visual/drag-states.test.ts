// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../lib/components/test-utils/selectors";

const dashboardWrapper = createWrapper().findDashboard();
const paletteWrapper = createWrapper().findPalette();
const dashboardItemHandle = (id: string) => dashboardWrapper.findItemById(id).findDragHandle().toSelector();
const dashboardItemResizeHandle = (id: string) => dashboardWrapper.findItemById(id).findResizeHandle().toSelector();

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
}

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
  "active item overlays other items",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(dashboardItemHandle("A"));
    await page.keys(["Enter"]);
    test(
      "active item overlays other items",
      setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
        await page.focus(dashboardItemHandle("A"));
        await page.keys(["Enter"]);
        await page.keys(["ArrowDown"]);

        expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
      })
    );
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
    async (page) => {
      await page.focus(dashboardItemResizeHandle("A"));
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

test(
  "palette item with min colspan=2 can be inserted into 1-column layout",
  setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
    await page.setWindowSize({ width: 800, height: 800 });

    await page.focus(paletteWrapper.findItemById("R").findDragHandle().toSelector());
    await page.keys(["Enter"]);

    await page.keys(["ArrowLeft"]);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    await page.keys(["Enter"]);
    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);