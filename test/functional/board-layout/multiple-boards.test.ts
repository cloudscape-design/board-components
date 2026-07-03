// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";

import createWrapper from "../../../lib/components/test-utils/selectors";
import { setupTest } from "../../utils";
import { DndPageObject } from "./dnd-page-object";

// Scope wrappers to each board via the test-id containers on the page.
const boardA = createWrapper('[data-testid="board-a"]').findBoard();
const boardB = createWrapper('[data-testid="board-b"]').findBoard();

class MultiBoardPageObject extends DndPageObject {
  getElementsAttributes(selector: string, attribute: string) {
    return this.browser.execute(
      (selector, attribute) =>
        [...document.querySelectorAll(selector)].map((element) => element.getAttribute(attribute)),
      selector,
      attribute,
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
