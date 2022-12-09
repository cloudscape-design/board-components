// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Coordinates, ItemId } from "../../internal/interfaces";
import { Rect } from "../../internal/interfaces";
import { getGridPlacement, isInside } from "../utils/rects";
import { Operation } from "./controller";

const getCollisions = (collisionRect: Rect, droppables: readonly [string, HTMLElement][]) => {
  const droppableRects = droppables.map(([, element]) => element.getBoundingClientRect());
  const bounds = getGridPlacement(collisionRect, droppableRects);
  return droppables.filter((_, index) => isInside(droppableRects[index], bounds)).map(([droppableId]) => droppableId);
};

export function getHoveredDroppables(
  operation: Operation,
  draggableElement: HTMLElement,
  coordinates: Coordinates,
  droppables: readonly [ItemId, HTMLElement][]
) {
  const activeRect = draggableElement.getBoundingClientRect();

  let collisionRect = { left: 0, top: 0, right: 0, bottom: 0 };

  if (operation === "reorder") {
    collisionRect = activeRect;
  }
  if (operation === "resize") {
    collisionRect = { left: activeRect.left, top: activeRect.top, right: coordinates.x, bottom: coordinates.y };
  }
  if (operation === "insert") {
    collisionRect = {
      left: coordinates.x,
      top: coordinates.y,
      right: coordinates.x + activeRect.width,
      bottom: coordinates.y + activeRect.height,
    };
  }

  return getCollisions(collisionRect, droppables);
}
