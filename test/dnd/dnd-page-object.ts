// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import gridStyles from "../../lib/components/internal/grid/styles.selectors.js";
import layoutStyles from "../../lib/components/layout/styles.selectors.js";
import createWrapper from "../../lib/components/test-utils/selectors";

const dashboardWrapper = createWrapper().findDashboard();

export class DndPageObject extends ScreenshotPageObject {
  async getGrid() {
    const placeholders = await this.browser.$$(`.${layoutStyles.default.root} .${layoutStyles.default.placeholder}`);
    const placehodlerRects = (
      await Promise.all(placeholders.map((el) => this.browser.getElementRect(el.elementId)))
    ).map(({ x: left, y: top, width, height }) => ({ left, right: left + width, top, bottom: top + height }));

    const items = await this.browser.$$(`.${layoutStyles.default.root} .${gridStyles.default.grid__item}`);
    const allIds = await Promise.all([...items].map((item) => item.getAttribute("data-item-id")));
    const widgetIds = allIds.filter((id) => !id.startsWith("awsui"));
    const widgetRects = await Promise.all(
      widgetIds.map((id) => this.getBoundingBox(dashboardWrapper.findItemById(id).toSelector()))
    );

    function matchWidget(placeholderIndex: number): null | string {
      const placeholderRect = placehodlerRects[placeholderIndex];

      for (let widgetIndex = 0; widgetIndex < widgetRects.length; widgetIndex++) {
        if (
          placeholderRect.top >= widgetRects[widgetIndex].top - 2 &&
          placeholderRect.left >= widgetRects[widgetIndex].left - 2 &&
          placeholderRect.right <= widgetRects[widgetIndex].right + 2 &&
          placeholderRect.bottom <= widgetRects[widgetIndex].bottom + 2
        ) {
          return widgetIds[widgetIndex];
        }
      }

      return null;
    }

    const columns = 4;
    const rows = Math.floor(placeholders.length / columns);
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
    await this.pause(25);
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

  async dragAndDrop(fromSelector: string, xOffset: number, yOffset: number) {
    await this.mouseDown(fromSelector);
    await this.mouseMove(xOffset, yOffset);
    await this.mouseUp();
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
