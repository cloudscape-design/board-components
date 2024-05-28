// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getLogicalBoundingClientRect } from "@cloudscape-design/component-toolkit/internal";

export function getNormalizedElementRect(element: HTMLElement): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
} {
  const { insetInlineStart, insetInlineEnd, insetBlockStart, insetBlockEnd, inlineSize, blockSize } =
    getLogicalBoundingClientRect(element);
  const xOffset = element.ownerDocument.defaultView!.pageXOffset - window.scrollX;
  const yOffset = element.ownerDocument.defaultView!.pageYOffset - window.scrollY;
  return {
    left: insetInlineStart + xOffset,
    right: insetInlineEnd + xOffset,
    top: insetBlockStart + yOffset,
    bottom: insetBlockEnd + yOffset,
    width: inlineSize,
    height: blockSize,
  };
}
