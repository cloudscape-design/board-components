// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "vitest";

import DragHandleWrapper from "@cloudscape-design/components/test-utils/selectors/internal/drag-handle";

import createWrapper from "../../../lib/components/test-utils/selectors";
import { makeQueryUrl, setupTest } from "../../utils";
import { DndPageObject } from "./dnd-page-object";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();
const boardItemDragHandle = (id: string) => boardWrapper.findItemById(id).findDragHandle().toSelector();
const boardItemResizeHandle = (id: string) => boardWrapper.findItemById(id).findResizeHandle().toSelector();
const paletteItemDragHandle = (id: string) => itemsPaletteWrapper.findItemById(id).findDragHandle().toSelector();
const dragHandleWrapper = new DragHandleWrapper("body");
const directionButtonUp = () => dragHandleWrapper.findVisibleDirectionButtonBlockStart().toSelector();
const directionButtonDown = () => dragHandleWrapper.findVisibleDirectionButtonBlockEnd().toSelector();
const directionButtonLeft = () => dragHandleWrapper.findVisibleDirectionButtonInlineStart().toSelector();
const directionButtonRight = () => dragHandleWrapper.findVisibleDirectionButtonInlineEnd().toSelector();

describe("items reordered with UAP actions", () => {
  test(
    "item move can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(boardItemDragHandle("A"));
      await page.handlerClick(directionButtonRight());
      await page.handlerClick(directionButtonRight());
      await page.handlerClick(directionButtonDown());
      await page.handlerClick(directionButtonLeft());
      await page.handlerClick(directionButtonUp());
      await page.keys(["Enter"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["B", "A", "C", "D"],
        ["B", "A", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    }),
  );

  test(
    "item move via UAP actions and keyboard can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(boardItemDragHandle("A"));
      await page.handlerClick(directionButtonRight());
      await page.keys(["ArrowRight"]);
      await page.keys(["ArrowDown"]);
      await page.handlerClick(directionButtonLeft());
      await page.keys(["ArrowUp"]);
      await page.keys(["Enter"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["B", "A", "C", "D"],
        ["B", "A", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    }),
  );

  test(
    "item move can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(boardItemDragHandle("A"));
      await page.handlerClick(directionButtonRight());
      await page.keys(["Escape"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    }),
  );

  test(
    "item keyboard move automatically submits after leaving focus",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(boardItemDragHandle("A"));
      await page.handlerClick(directionButtonRight());
      await page.keys(["Tab"]);
      await expect(page.getGrid()).resolves.toEqual([
        ["B", "A", "C", "D"],
        ["B", "A", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    }),
  );
});

describe("items resized with keyboard", () => {
  test(
    "item resize can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(boardItemResizeHandle("A"));
      await page.handlerClick(directionButtonRight());
      await page.handlerClick(directionButtonDown());
      await page.keys(["Enter"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "A", "C", "D"],
        ["A", "A", "C", "D"],
        ["A", "A", "G", "H"],
        ["E", "B", "G", "H"],
        ["E", "B", " ", " "],
        [" ", "F", " ", " "],
        [" ", "F", " ", " "],
      ]);
    }),
  );

  test(
    "item resize via UAP actions and keyboard can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(boardItemResizeHandle("A"));
      await page.handlerClick(directionButtonRight());
      await page.keys(["ArrowDown"]);
      await page.keys(["Enter"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "A", "C", "D"],
        ["A", "A", "C", "D"],
        ["A", "A", "G", "H"],
        ["E", "B", "G", "H"],
        ["E", "B", " ", " "],
        [" ", "F", " ", " "],
        [" ", "F", " ", " "],
      ]);
    }),
  );

  test(
    "item resize can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(boardItemResizeHandle("A"));
      await page.handlerClick(directionButtonRight());
      await page.handlerClick(directionButtonDown());
      await page.keys(["Escape"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    }),
  );

  test(
    "can't resize below min row/col span",
    setupTest(
      makeQueryUrl(
        [
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
        ],
        [],
      ),
      DndPageObject,
      async (page) => {
        await page.handlerClick(boardItemResizeHandle("X"));
        await page.handlerClick(directionButtonLeft());
        await page.handlerClick(directionButtonUp());
        await page.keys(["Enter"]);
        await expect(page.getGrid()).resolves.toEqual([
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
        ]);
      },
    ),
  );
});

describe("items inserted with keyboard", () => {
  test(
    "item insert can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(paletteItemDragHandle("I"));
      await page.handlerClick(directionButtonLeft());
      await page.handlerClick(directionButtonDown());
      await page.handlerClick(directionButtonDown());
      await page.handlerClick(directionButtonDown());
      await page.handlerClick(directionButtonDown());
      await page.keys(["Enter"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
        [" ", " ", " ", "I"],
        [" ", " ", " ", "I"],
      ]);
    }),
  );

  test(
    "item insert with keyboard automatically submits after mouse interaction",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(paletteItemDragHandle("I"));
      await page.handlerClick(directionButtonLeft());

      // click anywhere on the page to submit the current transition, for example on another item handle
      await page.handlerClick(boardItemResizeHandle("A"));

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "I"],
        ["A", "B", "C", "I"],
        ["E", "F", "G", "D"],
        ["E", "F", "G", "D"],
        [" ", " ", " ", "H"],
        [" ", " ", " ", "H"],
      ]);
    }),
  );

  test(
    "item insert can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(paletteItemDragHandle("I"));

      await page.handlerClick(directionButtonDown());
      await page.handlerClick(directionButtonDown());
      await page.keys(["Escape"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    }),
  );

  test(
    "item to be inserted with keyboard has preview content",
    setupTest("/index.html#/dnd/engine-a2h-test", DndPageObject, async (page) => {
      await page.handlerClick(paletteItemDragHandle("I"));
      await page.handlerClick(directionButtonLeft());
      await expect(page.getText(boardWrapper.find(`[data-item-id="I"]`).toSelector())).resolves.toBe(
        "Widget I\n(preview) Empty widget",
      );
      await expect(page.isDisplayed(boardItemResizeHandle("I"))).resolves.toBe(false);
    }),
  );

  test(
    "item in palette should be hidden when it is acquired by the board",
    setupTest("/index.html#/micro-frontend/integration", DndPageObject, async (page) => {
      await page.handlerClick(paletteItemDragHandle("M"));
      await page.handlerClick(directionButtonLeft());
      await expect(page.isDisplayed(paletteItemDragHandle("M"))).resolves.toBe(false);
    }),
  );
});
