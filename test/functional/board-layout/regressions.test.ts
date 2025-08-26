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
    await page.mouseMove(0, 255);
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
