// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Rect } from "../interfaces";

export function isInsideRect(rect: Rect, bounds: Rect) {
  return (
    rect.top >= bounds.top && rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom <= bounds.bottom
  );
}

export function isIntersecting(rect1: Rect, rect2: Rect) {
  const horizontalIntersection =
    (rect2.left <= rect1.left && rect1.left <= rect2.right) ||
    (rect2.left <= rect1.right && rect1.right <= rect2.right) ||
    (rect1.left <= rect2.left && rect2.left <= rect1.right) ||
    (rect1.left <= rect2.right && rect2.right <= rect1.right);
  const verticalIntersection =
    (rect2.top <= rect1.top && rect1.top <= rect2.bottom) ||
    (rect2.top <= rect1.bottom && rect1.bottom <= rect2.bottom) ||
    (rect1.top <= rect2.top && rect2.top <= rect1.bottom) ||
    (rect1.top <= rect2.bottom && rect2.bottom <= rect1.bottom);
  return horizontalIntersection && verticalIntersection;
}
