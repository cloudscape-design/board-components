// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "vitest";

import createWrapper from "../../../lib/components/test-utils/selectors";
import { setupTest } from "../../utils";
import { DndPageObject } from "./dnd-page-object";

const wrapper = createWrapper();
const boardWrapper = createWrapper().findBoard();
const boardItemSelector = wrapper.findBoardItem().toSelector();

describe("conditional editing feature", () => {
  test(
    "item sizes is preserved between editable and static mode",
    setupTest("/index.html#/conditional/conditional", DndPageObject, async (page) => {
      const getWidgetSizes = async () => [
        await page.getBoundingBox(boardWrapper.findItemById("one").toSelector()),
        await page.getBoundingBox(boardWrapper.findItemById("two").toSelector()),
        await page.getBoundingBox(boardWrapper.findItemById("three").toSelector()),
      ];
      const sizeBefore = await getWidgetSizes();
      // no board items by default
      await expect(page.getElementsCount(boardItemSelector)).resolves.toEqual(0);
      await page.click('[data-testid="edit-toggle"]');
      // board items are rendering after toggle the mode
      await expect(page.getElementsCount(boardItemSelector)).resolves.toEqual(3);
      await expect(getWidgetSizes()).resolves.toEqual(sizeBefore);
      await page.click('[data-testid="edit-toggle"]');
      // board items are hidden after toggling it back
      await expect(page.getElementsCount(boardItemSelector)).resolves.toEqual(0);
      await expect(getWidgetSizes()).resolves.toEqual(sizeBefore);
    }),
  );
});
