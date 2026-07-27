// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeAll, expect, test } from "vitest";

import { Droppable } from "../../../../lib/components/internal/dnd-controller/controller";
import { Rect } from "../../../../lib/components/internal/interfaces";
import { getNextDroppable } from "../../../../lib/components/internal/item-container/get-next-droppable";

const originalGetComputedStyle = window.getComputedStyle;
beforeAll(() => {
  window.getComputedStyle = (element: Element) =>
    element instanceof Element ? originalGetComputedStyle(element) : ({} as any);
});

function getMockElement({ left, right, top, bottom }: Rect) {
  return {
    getBoundingClientRect: () => ({ left, right, top, bottom, width: right - left, height: bottom - top }),
    ownerDocument: {
      defaultView: {
        pageXOffset: 0,
        pageYOffset: 0,
      },
    },
  } as HTMLElement;
}

test("returns null if there are no droppables", () => {
  const elementMock = getMockElement({ left: 0, right: 0, top: 0, bottom: 0 });
  expect(getNextDroppable({ draggableElement: elementMock, droppables: [], direction: "left", isRtl: false })).toBe(
    null,
  );
});

test("returns next droppable matching the direction", () => {
  const elementMock = getMockElement({ left: 6, right: 4, top: 0, bottom: 0 });
  const next = getNextDroppable({
    draggableElement: elementMock,
    droppables: [
      ["1", { element: getMockElement({ left: 0, right: 10, top: 0, bottom: 0 }) } as Droppable],
      ["2", { element: getMockElement({ left: 5, right: 5, top: 0, bottom: 0 }) } as Droppable],
      ["3", { element: getMockElement({ left: 10, right: 0, top: 0, bottom: 0 }) } as Droppable],
    ],
    direction: "right",
    isRtl: false,
  });
  expect(next).toBe("2");
});

test("only considers droppables from the provided (single board) set", () => {
  // When multiple boards share a controller, each board's ItemContainer keyboard insertion only
  // walks the droppables it can see. This test simulates that by passing the droppables of a single
  // board even though another board's droppable sits closer in the same direction.
  const elementMock = getMockElement({ left: 6, right: 4, top: 0, bottom: 0 });

  const closerOtherBoardDroppable: [string, Droppable] = [
    "other-board-placeholder",
    { element: getMockElement({ left: 5, right: 5, top: 0, bottom: 0 }) } as Droppable,
  ];
  const sameBoardDroppable: [string, Droppable] = [
    "same-board-placeholder",
    { element: getMockElement({ left: 20, right: 30, top: 0, bottom: 0 }) } as Droppable,
  ];

  // Only the same-board droppable is provided, so it must be chosen even though another board's
  // droppable would have been closer had it been in scope.
  const next = getNextDroppable({
    draggableElement: elementMock,
    droppables: [sameBoardDroppable],
    direction: "right",
    isRtl: false,
  });
  expect(next).toBe("same-board-placeholder");

  // Sanity check: when the other board's droppable IS in scope it wins, confirming the previous
  // result was due to scoping and not distance.
  const nextWithBoth = getNextDroppable({
    draggableElement: elementMock,
    droppables: [sameBoardDroppable, closerOtherBoardDroppable],
    direction: "right",
    isRtl: false,
  });
  expect(nextWithBoth).toBe("other-board-placeholder");
});
