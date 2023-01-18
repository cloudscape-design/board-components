// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem, ItemId } from "../../internal/interfaces";

/**
 * Creates a minimal hovered rectangle (in grid units) that contains all collided placeholders.
 */
export function getHoveredRect(collisionsIds: readonly ItemId[], placeholders: readonly GridLayoutItem[]) {
  const hoveredPlaceholders = collisionsIds.map((id) => placeholders.find((p) => p.id === id)!);
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
    }
  );
}
