// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";

import createWrapper from "../../../lib/components/test-utils/selectors";
import { setupTest } from "../../utils";
import { DndPageObject } from "./dnd-page-object";

// Scope wrappers to each board and palette via the test-id containers on the page.
const boardA = createWrapper('[data-testid="board-a"]').findBoard();
const boardB = createWrapper('[data-testid="board-b"]').findBoard();
const palette = createWrapper('[data-testid="palette"]').findItemsPalette();

class MultiBoardPageObject extends DndPageObject {
  getElementsAttributes(selector: string, attribute: string) {
    return this.browser.execute(
      (selector, attribute) =>
        [...document.querySelectorAll(selector)].map((element) => element.getAttribute(attribute)),
      selector,
      attribute,
    );
  }

  getElementHeight(selector: string) {
    return this.browser.execute((selector) => {
      const el = document.querySelector(selector);
      return el ? el.getBoundingClientRect().height : 0;
    }, selector);
  }

  getItemLeft(boardTestId: string, itemId: string) {
    return this.browser.execute(
      (boardTestId, itemId) => {
        const item = document.querySelector(`[data-testid="${boardTestId}"] [data-item-id="${itemId}"]`);
        return item?.getBoundingClientRect().left ?? null;
      },
      boardTestId,
      itemId,
    );
  }
}

function itemIds(page: MultiBoardPageObject, boardTestId: string) {
  return page.getElementsAttributes(`[data-testid="${boardTestId}"] [data-item-id]`, "data-item-id");
}

test(
  "pointer reorder in one board does not affect the other",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    // Sanity: each board renders its own disjoint items.
    await expect(itemIds(page, "board-a")).resolves.toEqual(["A", "B", "C", "D"]);
    await expect(itemIds(page, "board-b")).resolves.toEqual(["E", "F", "G", "H"]);

    // Reorder within board A: drag A onto B.
    await page.dragAndDropTo(
      boardA.findItemById("A").findDragHandle().toSelector(),
      boardA.findItemById("B").findDragHandle().toSelector(),
    );

    // Board A reordered; board B is untouched.
    await expect(itemIds(page, "board-a")).resolves.toEqual(["B", "A", "C", "D"]);
    await expect(itemIds(page, "board-b")).resolves.toEqual(["E", "F", "G", "H"]);
  }),
);

test(
  "pointer resize in one board does not affect the other",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    const before = await itemIds(page, "board-b");

    await page.dragAndDropTo(
      boardA.findItemById("A").findResizeHandle().toSelector(),
      boardA.findItemById("B").findResizeHandle().toSelector(),
    );

    // Board B keeps the same items in the same order.
    await expect(itemIds(page, "board-b")).resolves.toEqual(before);
  }),
);

test(
  "dragging an item from one board over another board does not crash or move items into it",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    await expect(itemIds(page, "board-a")).resolves.toEqual(["A", "B", "C", "D"]);
    await expect(itemIds(page, "board-b")).resolves.toEqual(["E", "F", "G", "H"]);

    await page.dragAndDropTo(
      boardA.findItemById("A").findDragHandle().toSelector(),
      boardB.findItemById("E").findDragHandle().toSelector(),
    );

    // Board B is untouched: same items, same order, and it never gained board A's item.
    await expect(itemIds(page, "board-b")).resolves.toEqual(["E", "F", "G", "H"]);

    // Board A still owns exactly its own four items (order may have changed), and none leaked to B.
    await expect(itemIds(page, "board-a").then((ids) => [...ids].sort())).resolves.toEqual(["A", "B", "C", "D"]);
  }),
);

test(
  "keyboard palette insert expands all boards on start (matching pointer)",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    // A keyboard insert reserves landing rows on every board (a drop-zone affordance), identically
    // to a pointer insert. Measure a non-target board's height before and during the insert.
    const boardAHeight = () => page.getElementHeight('[data-testid="board-a"]');

    const before = await boardAHeight();

    // Start a keyboard insert from the palette (do not acquire into any board yet).
    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]);

    // Board A grows even though the item has not been acquired into it: landing rows are reserved.
    const during = await boardAHeight();
    expect(during).toBeGreaterThan(before);

    await page.keys(["Escape"]);
  }),
);

test(
  "keyboard palette insert acquires into the nearest board via ArrowLeft",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    // The palette sits to the right of the stacked boards. Start a keyboard insert.
    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]); // start insert transition

    // ArrowLeft acquires item I into Board A, the nearest board to the left of the palette.
    await page.keys(["ArrowLeft"]);
    await expect(itemIds(page, "board-a")).resolves.toContain("I");
    await expect(itemIds(page, "board-b")).resolves.not.toContain("I");

    await page.keys(["Escape"]);
  }),
);

test(
  "keyboard insert transfers between boards across the row boundary",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    // Acquire item I into Board A (the nearest board left of the palette).
    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]);
    await page.keys(["ArrowLeft"]);
    await expect(itemIds(page, "board-a")).resolves.toContain("I");
    await page.pause(150);
    const sourceColumnLeft = await page.getItemLeft("board-a", "I");

    // Walk the acquired item down through Board A; past its bottom boundary it transfers into Board B
    // (rendered below A). Board A is 2 rows and the landing area adds room, so several presses are
    // needed to cross.
    for (let i = 0; i < 5; i++) {
      await page.keys(["ArrowDown"]);
    }

    // Item I is now in Board B and no longer in Board A.
    await expect(itemIds(page, "board-b")).resolves.toContain("I");
    await expect(itemIds(page, "board-a")).resolves.not.toContain("I");
    await page.pause(150);
    expect(await page.getItemLeft("board-b", "I")).toBeCloseTo(sourceColumnLeft!, 0);

    // Submit the insert: Board B keeps item I, Board A does not.
    await page.keys(["Enter"]);
    await expect(itemIds(page, "board-b")).resolves.toContain("I");
    await expect(itemIds(page, "board-a")).resolves.not.toContain("I");
  }),
);

test(
  "upward transfer does not add landing rows to the target board",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    const boardAHeight = () => page.getElementHeight('[data-testid="board-a"]');

    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]);
    const reservedHeight = await boardAHeight();

    await page.keys(["ArrowLeft"]);
    for (let i = 0; i < 5; i++) {
      await page.keys(["ArrowDown"]);
    }
    await expect(itemIds(page, "board-b")).resolves.toContain("I");
    expect(await boardAHeight()).toBe(reservedHeight);

    // Board A is above Board B. Moving up selects a placeholder at Board A's bottom edge, but the
    // acquired item must fit inside the rows Board A already reserved when the insertion started.
    await page.keys(["ArrowUp"]);

    await expect(itemIds(page, "board-a")).resolves.toContain("I");
    expect(await boardAHeight()).toBe(reservedHeight);

    await page.keys(["Escape"]);
  }),
);

test(
  "Tab commits a transferred keyboard insert and clears non-target board state",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    const boardAHeight = () => page.getElementHeight('[data-testid="board-a"]');
    const boardCHeight = () => page.getElementHeight('[data-testid="board-c"]');
    const restingBoardAHeight = await boardAHeight();
    const restingBoardCHeight = await boardCHeight();

    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]);
    await page.keys(["ArrowLeft"]);
    for (let i = 0; i < 5; i++) {
      await page.keys(["ArrowDown"]);
    }

    await expect(itemIds(page, "board-b")).resolves.toContain("I");
    expect(await boardAHeight()).toBeGreaterThan(restingBoardAHeight);
    expect(await boardCHeight()).toBeGreaterThan(restingBoardCHeight);

    // Blurring the acquired item must commit on its current board. The source and untouched empty
    // board must also leave their shared insert transition and collapse their landing rows.
    await page.keys(["Tab"]);

    await expect(itemIds(page, "board-b")).resolves.toContain("I");
    await expect(itemIds(page, "palette")).resolves.not.toContain("I");
    await page.waitForAssertion(async () => {
      expect(await boardAHeight()).toBe(restingBoardAHeight);
      expect(await boardCHeight()).toBe(restingBoardCHeight);
    });
  }),
);

test(
  "keyboard insert transfers through populated boards into an empty board",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    await expect(itemIds(page, "board-c")).resolves.toEqual([]);

    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]);
    await page.keys(["ArrowLeft"]);
    await expect(itemIds(page, "board-a")).resolves.toContain("I");
    await page.pause(150);
    const sourceColumnLeft = await page.getItemLeft("board-a", "I");

    let visitedBoardB = false;
    let reachedBoardC = false;
    for (let i = 0; i < 12 && !reachedBoardC; i++) {
      await page.keys(["ArrowDown"]);
      visitedBoardB ||= (await itemIds(page, "board-b")).includes("I");
      reachedBoardC = (await itemIds(page, "board-c")).includes("I");
    }

    expect(visitedBoardB).toBe(true);
    expect(reachedBoardC).toBe(true);
    await expect(itemIds(page, "board-a")).resolves.not.toContain("I");
    await expect(itemIds(page, "board-b")).resolves.not.toContain("I");
    await page.pause(150);
    expect(await page.getItemLeft("board-c", "I")).toBeCloseTo(sourceColumnLeft!, 0);

    await page.keys(["Enter"]);
    await expect(itemIds(page, "board-c")).resolves.toEqual(["I"]);
  }),
);

test(
  "a board keeps its landing rows after the item is transferred out of it",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    const boardAHeight = () => page.getElementHeight('[data-testid="board-a"]');

    // Start a keyboard insert; every board grows to show landing rows.
    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]);
    const grown = await boardAHeight();

    // Acquire into Board A, then transfer the item down into Board B.
    await page.keys(["ArrowLeft"]);
    await expect(itemIds(page, "board-a")).resolves.toContain("I");
    for (let i = 0; i < 5; i++) {
      await page.keys(["ArrowDown"]);
    }
    await expect(itemIds(page, "board-b")).resolves.toContain("I");

    // Board A handed the item off but the insert is still in progress, so it must keep its landing
    // rows (same as a pointer insert) rather than collapsing back to its resting height.
    expect(await boardAHeight()).toBe(grown);

    await page.keys(["Escape"]);
  }),
);
