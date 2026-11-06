// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";

import createWrapper from "../../../lib/components/test-utils/selectors";
import { setupTest } from "../../utils";
import { DndPageObject } from "./dnd-page-object";

const pageUrl = "/index.html#/dnd/engine-scroll-container-test";
const containerSelector = '[data-testid="scroll-container"]';
const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();

// Presses the handle and moves the pointer to 20px above the scroll container's bottom edge.
async function dragToContainerBottom(page: DndPageObject, handleSelector: string, targetX?: number) {
  const container = await page.getBoundingBox(containerSelector);
  const handle = await page.getElementCenter(handleSelector);
  await page.mouseDown(handleSelector);
  await page.mouseMove(targetX === undefined ? 0 : targetX - handle.x, container.bottom - 20 - handle.y);
}

// Scroll speed depends on the machine, so wait for the container to advance instead of pausing a fixed time.
async function waitForScrollTop(page: DndPageObject, minimum: number) {
  let scrollTop = 0;
  for (let attempt = 0; attempt < 20 && scrollTop < minimum; attempt++) {
    await page.pause(50);
    scrollTop = (await page.getElementScroll(containerSelector)).top;
  }
  return scrollTop;
}

test(
  "auto-scrolls the scrollable ancestor instead of the window while dragging near its bottom edge, and stops on pointer up",
  setupTest(pageUrl, DndPageObject, async (page) => {
    await dragToContainerBottom(page, boardWrapper.findItemById("A").findDragHandle().toSelector());

    expect(await waitForScrollTop(page, 50)).toBeGreaterThanOrEqual(50);
    await expect(page.getWindowScroll()).resolves.toEqual(expect.objectContaining({ top: 0 }));

    await page.mouseUp();
    const scrollAfterUp = await page.getElementScroll(containerSelector);
    await page.pause(50);
    await expect(page.getElementScroll(containerSelector)).resolves.toEqual(scrollAfterUp);
  }),
);

test(
  "auto-scrolls the ancestor when inserting an item from the palette",
  setupTest(pageUrl, DndPageObject, async (page) => {
    const target = await page.getElementCenter(boardWrapper.findItemById("B").findDragHandle().toSelector());
    await dragToContainerBottom(page, itemsPaletteWrapper.findItemById("M").findDragHandle().toSelector(), target.x);

    expect(await waitForScrollTop(page, 50)).toBeGreaterThanOrEqual(50);

    await page.mouseUp();
  }),
);
