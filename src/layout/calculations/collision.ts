// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayoutItem } from "../../internal/interfaces";
import { Rect } from "../../internal/interfaces";

function collisionsToRect(collisions: Array<GridLayoutItem>): Rect {
  return collisions.reduce(
    (rect, collision) => ({
      top: Math.min(rect.top, collision.y),
      left: Math.min(rect.left, collision.x),
      bottom: Math.max(rect.bottom, collision.y + collision.height),
      right: Math.max(rect.right, collision.x + collision.width),
    }),
    {
      top: Number.POSITIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
    }
  );
}

export function getHoveredRect(collisionsIds: ReadonlyArray<string>, placeholders: ReadonlyArray<GridLayoutItem>) {
  const hoveredPlaceholders = collisionsIds.map((id) => placeholders.find((p) => p.id === id)!);
  return collisionsToRect(hoveredPlaceholders);
}
