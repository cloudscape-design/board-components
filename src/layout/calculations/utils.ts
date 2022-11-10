// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayoutItem } from "../../internal/base-types";
import { Rect } from "./interfaces";

export function itemToRect(item: GridLayoutItem): Rect {
  return {
    left: item.x,
    top: item.y,
    right: item.x + item.width,
    bottom: item.y + item.height,
  };
}

export function isInsideRect(rect: Rect, bounds: Rect) {
  return (
    rect.top <= bounds.top && rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom >= bounds.bottom
  );
}
