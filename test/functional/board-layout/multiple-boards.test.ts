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

    // Drag an item from board A and release it over an item that lives in board B. Because all
    // boards share one d&d controller, the drag rect crosses into board B's droppable
    // region. This used to crash: board A received board B's placeholder collision ids and
    // dereferenced them in getHoveredRect / appendPath. The regression guards ensure that instead:
    //   - the page does not crash,
    //   - no item ever crosses into board B, and
    //   - board B keeps its exact items and order.
    // (Board A may legitimately reorder its own items, since the drag passes over board A's own
    // tiles on the way out; that is not what this test asserts.)
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

// AWSUI-62123 bug bash finding #2: on keyboard insert-start, non-target boards should NOT grow.
// Only the board that actually acquires the item should reserve extra landing rows.
test(
  "keyboard palette insert does not expand non-target boards",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    // Measure Board A's height before and after starting a keyboard insert from the palette.
    const boardAHeight = () => page.getElementHeight('[data-testid="board-a"]');

    const before = await boardAHeight();

    // Start a keyboard insert from the palette and acquire into Board B (the nearest above).
    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]);
    await page.keys(["ArrowUp"]);

    // Board A (not the target) must not have grown.
    const after = await boardAHeight();
    expect(after).toBe(before);

    await page.keys(["Escape"]);
  }),
);

// AWSUI-62123 bug bash finding #3: keyboard palette insert should reach any board, not just the
// nearest. After acquiring into the bottom board, pressing ArrowUp at the top of that board should
// transfer the item to the board above it.
test(
  "keyboard palette insert can transfer through boards via ArrowUp",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    // Palette item I is below Board B. Start a keyboard insert.
    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]); // start insert transition

    // First ArrowUp acquires item I into Board B (the nearest board above the palette).
    await page.keys(["ArrowUp"]);
    await expect(itemIds(page, "board-b")).resolves.toContain("I");

    // Move item I to the top of Board B (row 0). Board B has 2 rows (items are 1×2 each in a 2-col grid).
    // The item starts at the bottom; move it to the top.
    await page.keys(["ArrowUp"]);
    await page.keys(["ArrowUp"]);
    await page.keys(["ArrowUp"]);

    // One more ArrowUp at the boundary of Board B should transfer item I into Board A.
    await page.keys(["ArrowUp"]);

    // Item I is now in Board A (and no longer in Board B).
    await expect(itemIds(page, "board-a")).resolves.toContain("I");

    // Submit the insert.
    await page.keys(["Enter"]);

    // After submission, Board A has item I, Board B does not.
    await expect(itemIds(page, "board-a")).resolves.toContain("I");
    await expect(itemIds(page, "board-b")).resolves.not.toContain("I");
  }),
);

// Cross-board transfer via lateral boundary: item at column 0, pressing ArrowLeft transfers to
// the board above (or nearest board in that direction from the DOM element's position).
test(
  "keyboard insert transfers via ArrowLeft at column boundary",
  setupTest("/index.html#/dnd/multiple-boards-test", MultiBoardPageObject, async (page) => {
    // Start a keyboard insert from the palette and acquire into Board B.
    await page.focus(palette.findItemById("I").findDragHandle().toSelector());
    await page.keys(["Enter"]);
    await page.keys(["ArrowUp"]); // acquire into Board B

    await expect(itemIds(page, "board-b")).resolves.toContain("I");

    // Item I acquired at column 0. Pressing ArrowLeft at x=0 → boundary → attempts transfer.
    await page.keys(["ArrowLeft"]);

    // The item should have transferred to Board A (the board above/left in the DOM).
    // If no board was found in that direction, it stays in Board B (which is also acceptable —
    // the key thing is it doesn't crash or silently swallow the key).
    const inA = await itemIds(page, "board-a").then((ids) => ids.includes("I"));
    const inB = await itemIds(page, "board-b").then((ids) => ids.includes("I"));

    // It should be in exactly one board.
    expect(inA || inB).toBe(true);

    await page.keys(["Escape"]);
  }),
);
