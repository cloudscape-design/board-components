// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Operation } from "../dnd-controller/controller";
import { Rect } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { getNormalizedElementRect } from "../utils/screen";

/**
 * Produces a rect (in coordinates) to represent the draggable item.
 */
export function getCollisionRect(
  operation: Operation,
  draggableElement: HTMLElement,
  coordinates: Coordinates,
  sizeOverride: null | { width: number; height: number }
): Rect {
  const { left, top, width, height } = getNormalizedElementRect(draggableElement);

  switch (operation) {
    case "reorder":
      return { left: coordinates.x, right: coordinates.x + width, top: coordinates.y, bottom: coordinates.y + height };
    case "resize":
      return { left: left, top: top, right: coordinates.x, bottom: coordinates.y };
    case "insert":
      return {
        left: coordinates.x,
        top: coordinates.y,
        right: coordinates.x + (sizeOverride?.width ?? width),
        bottom: coordinates.y + (sizeOverride?.height ?? height),
      };
  }
}
