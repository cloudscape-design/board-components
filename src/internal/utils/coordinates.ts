// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PointerEvent as ReactPointerEvent } from "react";

import { getLogicalClientX } from "@cloudscape-design/component-toolkit/internal";

export class Coordinates {
  readonly __type = "Coordinates";
  readonly x: number;
  readonly y: number;
  readonly scrollX = window.scrollX;
  readonly scrollY = window.scrollY;

  static fromEvent(event: PointerEvent | ReactPointerEvent<unknown>, { isRtl }: { isRtl: boolean }): Coordinates {
    const clientX = getLogicalClientX(event, isRtl);
    const clientY = event.clientY;
    return new Coordinates({ x: clientX, y: clientY });
  }

  static cursorOffset(current: Coordinates, start: Coordinates): Coordinates {
    return new Coordinates({
      x: current.x - start.x + (current.scrollX - start.scrollX),
      y: current.y - start.y + (current.scrollY - start.scrollY),
    });
  }

  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }
}
