// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import dragHandleStyles from "../../lib/components/internal/drag-handle/styles.selectors.js";
import resizeHandleStyles from "../../lib/components/internal/resize-handle/styles.selectors.js";
import layoutItemStyles from "../../lib/components/item/styles.selectors.js";
import layoutStyles from "../../lib/components/layout/styles.selectors.js";

export class DndPageObject extends ScreenshotPageObject {
  sleep(time = 200) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async getHeaders() {
    const items = await this.browser.$$(`.${layoutStyles.default.root} .${layoutItemStyles.default.header}`);
    const headers = await Promise.all([...items].map((item) => item.getText()));

    const columns = 4;
    const rows = Math.floor(headers.length / columns);
    const grid: string[][] = [...new Array(rows)].map(() => [...new Array(columns)]);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        grid[row][col] = headers[row * columns + col]?.slice("Widget ".length) ?? " ";
      }
    }

    return grid;
  }

  async clickDragHandle(id: string) {
    await this.click(`[data-item-id="${id}"] .${dragHandleStyles.default.handle}`);
  }

  async focusDragHandle(id: string) {
    await this.clickDragHandle(id);
    await this.keys(["Enter"]);
  }

  async focusResizeHandle(id: string) {
    await this.click(`[data-item-id="${id}"] .${resizeHandleStyles.default.handle}`);
    await this.keys(["Enter"]);
  }

  isDragHandleFocused(id: string) {
    return this.isFocused(`[data-item-id="${id}"] .${dragHandleStyles.default.handle}`);
  }

  async getItemSize(id: string) {
    return (await this.browser.$(`[data-item-id="${id}"]`)).getSize();
  }
}
