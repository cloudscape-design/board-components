// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { SortingStrategy } from "@dnd-kit/sortable";
import { Transform } from "@dnd-kit/utilities";
import chunk from "lodash/chunk";

export function getPosition<T>(chunked: Array<Array<T>>, item: T) {
  const row = chunked.find((row) => row.includes(item))!;
  const x = row.indexOf(item);
  const y = chunked.indexOf(row);
  return { x, y };
}

const GAP = 10;

const defaults: Transform = { x: 0, y: 0, scaleX: 1, scaleY: 1 };

export const createGridStrategy =
  (itemsPerRow: number): SortingStrategy =>
  ({ activeIndex, index, rects, overIndex }) => {
    const chunked = chunk(rects, itemsPerRow);
    const currentPosition = getPosition(chunked, rects[index]);
    const activePosition = getPosition(chunked, rects[activeIndex]);
    const overPosition = getPosition(chunked, rects[overIndex]);

    // +1 up, -1 down
    const vy = Math.sign(activePosition.y - overPosition.y);
    const vx = Math.sign(activePosition.x - overPosition.x);
    let dy = 0;
    let dx = 0;

    if (
      currentPosition.x === overPosition.x && // same col
      Math.sign(activePosition.y - currentPosition.y) === vy && // is after active
      Math.sign(currentPosition.y - overPosition.y + vy) === vy // and before or over
    ) {
      dy = (rects[index].height + GAP) * vy;
    }

    if (
      currentPosition.y === activePosition.y && // same row
      Math.sign(activePosition.x - currentPosition.x) === vx && // is after active
      Math.sign(currentPosition.x - overPosition.x + vx) === vx // and before or over
    ) {
      dx = (rects[index].width + GAP) * vx;
    }
    if (dx !== 0 || dy !== 0) {
      return { ...defaults, x: dx, y: dy };
    }
    return null;
  };
