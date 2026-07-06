// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem, ItemId, Rect } from "../../internal/interfaces";

/**
 * Creates a minimal hovered rectangle (in grid units) that contains all collided placeholders.
 *
 * Returns `null` when none of the collision IDs match the given placeholders. This happens when the
 * reported collisions belong to a different board (multiple boards share one d&d controller) or are
 * stale relative to the current placeholder grid. Callers must treat `null` as "no hovered cell"
 * rather than extending the transition path — a fabricated rect here would seed the path with
 * out-of-range coordinates and later break appendPath.
 */
export function getHoveredRect(collisionsIds: readonly ItemId[], placeholders: readonly GridLayoutItem[]): null | Rect {
  const hoveredPlaceholders = collisionsIds
    .map((id) => placeholders.find((p) => p.id === id))
    .filter((placeholder): placeholder is GridLayoutItem => !!placeholder);

  if (hoveredPlaceholders.length === 0) {
    return null;
  }

  return hoveredPlaceholders.reduce(
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
    },
  );
}
