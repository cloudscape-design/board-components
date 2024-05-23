// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";
import { Droppable } from "../../../../lib/components/internal/dnd-controller/controller";
import { Rect } from "../../../../lib/components/internal/interfaces";
import { getNextDroppable } from "../../../../lib/components/internal/item-container/get-next-droppable";

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
