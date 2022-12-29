// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { BasePageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import layoutStyles from "../../../lib/components/layout/styles.selectors.js";

export class DndPageObject extends BasePageObject {
  async getGrid() {
    await this.pause(50);

    const widgets = await this.browser.execute(
      (widgetsSelector) =>
        [...document.querySelectorAll(widgetsSelector)].map(
          (w) => [w.getAttribute("data-item-id"), w.getBoundingClientRect()] as [string, DOMRect]
        ),
      `.${layoutStyles.default.root} [data-item-id]`
    );

    const placeholderRects = await this.browser.execute(
      (placeholderSelector) =>
        [...document.querySelectorAll(placeholderSelector)].map((p) => p.getBoundingClientRect()),
      `.${layoutStyles.default.placeholder}`
    );

    function matchWidget(placeholderIndex: number): null | string {
      const placeholderRect = placeholderRects[placeholderIndex];

      for (let widgetIndex = 0; widgetIndex < widgets.length; widgetIndex++) {
        if (
          placeholderRect.top >= widgets[widgetIndex][1].top - 2 &&
          placeholderRect.left >= widgets[widgetIndex][1].left - 2 &&
          placeholderRect.right <= widgets[widgetIndex][1].right + 2 &&
          placeholderRect.bottom <= widgets[widgetIndex][1].bottom + 2
        ) {
          return widgets[widgetIndex][0];
        }
      }

      return null;
    }

    const columns = 4;
    const rows = Math.floor(placeholderRects.length / columns);
    const grid: string[][] = [...new Array(rows)].map(() => [...new Array(columns)]);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        grid[row][col] = matchWidget(row * columns + col) ?? " ";
      }
    }

    return grid;
  }

  async focus(selector: string) {
    await this.browser.execute((target) => {
      (document.querySelector(target) as HTMLButtonElement)!.focus();
    }, selector);
  }

  async keys(keys: string[]) {
    await super.keys(keys);
    await this.pause(100);
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
          { type: "pause", duration: 100 },
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
          { type: "pause", duration: 100 },
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
          { type: "pause", duration: 100 },
        ],
      },
    ]);
  }

  async dragAndDropTo(fromSelector: string, targetSelector: string, offsetX = 0, offsetY = 0) {
    const fromCenter = await this.getElementCenter(fromSelector);
    const targetCenter = await this.getElementCenter(targetSelector);
    offsetX += targetCenter.x - fromCenter.x;
    offsetY += targetCenter.y - fromCenter.y;

    await this.mouseDown(fromSelector);
    await this.mouseMove(offsetX, offsetY);
    await this.mouseUp();
  }

  async getElementCenter(selector: string) {
    const targetRect = await this.getBoundingBox(selector);
    const x = Math.round(targetRect.left + targetRect.width / 2);
    const y = Math.round(targetRect.top + targetRect.height / 2);
    return { x, y };
  }
}