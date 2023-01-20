// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ItemId } from "../../internal/interfaces";
import { Rect } from "../../internal/interfaces";
import { Coordinates } from "../utils/coordinates";
import { getGridPlacement, isInside, isIntersecting } from "../utils/rects";
import { getNormalizedElementRect } from "../utils/screen";
import { Operation } from "./controller";

/**
 * Produces a rect (in coordinates) to represent the draggable item.
 */
export function getCollisionRect(operation: Operation, draggableElement: HTMLElement, coordinates: Coordinates) {
  const activeRect = getNormalizedElementRect(draggableElement);

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

  return collisionRect;
}

/**
 * Returns IDs of droppables hovered by the draggable rect.
 */
export function getHoveredDroppables(
  collisionRect: Rect,
  droppables: readonly [ItemId, HTMLElement][],
  fixedRects: readonly DOMRect[]
) {
  // The collisions are ignored if the draggable intersects with any fixed element on the page.
  for (const fixedRect of fixedRects) {
    if (isIntersecting(fixedRect, collisionRect)) {
      return [];
    }
  }
  const droppableRects = droppables.map(([, element]) => getNormalizedElementRect(element));
  const bounds = getGridPlacement(collisionRect, droppableRects);
  return droppables.filter((_, index) => isInside(droppableRects[index], bounds)).map(([droppableId]) => droppableId);
}

/**
 * Returns all fixed/sticky element DOM rects from the page.
 */
export function queryFixedRects(): readonly DOMRect[] {
  const rects: DOMRect[] = [];

  const allElements = document.querySelectorAll("*");
  for (let index = 0; index < allElements.length; index++) {
    const element = allElements[index];
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    const computedStyle = getComputedStyle(element);
    const isDisplayed = computedStyle.display !== "none";
    const isFixedOrSticky = computedStyle.position === "fixed" || computedStyle.position === "sticky";
    if (isDisplayed && isFixedOrSticky) {
      rects.push(element.getBoundingClientRect());
    }
  }

  return rects.filter((rect) => rect.width > 0 && rect.height > 0);
}
