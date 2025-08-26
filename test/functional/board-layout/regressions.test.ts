// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import createWrapper from "../../../lib/components/test-utils/selectors";
import { setupTest } from "../../utils";
import { DndPageObject } from "./dnd-page-object";

const boardWrapper = createWrapper().findBoard();

test(
  "should stop autoscroll upon receiving pointer-up",
  setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
    await page.mouseDown(boardWrapper.findItemById("G").findResizeHandle().toSelector());

    const scroll1 = await page.getWindowScroll();
    expect(scroll1.top).toBe(0);

    // This should cancel the operation.
    await page.mouseMove(0, 230);
    await page.pause(25);
    await page.mouseUp();

    const scroll2 = await page.getWindowScroll();
    expect(scroll2.top).toBeGreaterThan(100);

    await page.pause(25);
    const scroll3 = await page.getWindowScroll();
    expect(scroll3.top).toBe(scroll2.top);

    await page.pause(25);
    const scroll4 = await page.getWindowScroll();
    expect(scroll4.top).toBe(scroll3.top);
  }),
);

test.each(["Enter", "Space", "Escape", "ArrowRight", "ArrowDown"])("start d&d operation and cancel it with %s", (key) =>
  setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
    const handle = Math.random() > 0.5 ? "findDragHandle" : "findResizeHandle";
    await page.mouseDown(boardWrapper.findItemById("A")[handle]().toSelector());

    // This should cancel the operation.
    await page.mouseMove(10, 10);
    await page.keys([key]);

    // These should have no effect.
    await page.mouseMove(10, 10);
    await page.keys([key]);
    await page.mouseMove(10, 10);
    await page.keys([key]);

    await expect(page.getGrid()).resolves.toEqual([
      ["A", "B", "C", "D"],
      ["A", "B", "C", "D"],
      ["E", "F", "G", "H"],
      ["E", "F", "G", "H"],
    ]);
  })(),
);
