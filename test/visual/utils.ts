// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";

export function setupScreenshotTest(url: string, test: (page: DndPageObject) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new DndPageObject(browser);
    await page.waitForVisible("main");
    await page.waitForJsTimers(500);
    await test(page);
  });
}

class DndPageObject extends ScreenshotPageObject {
  async focus(selector: string) {
    await this.browser.execute((target) => {
      (document.querySelector(target) as HTMLButtonElement)!.focus();
    }, selector);
    await this.browser.keys(["ArrowDown"]);
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
    await this.pause(200);
    return super.fullPageScreenshot();
  }
}
