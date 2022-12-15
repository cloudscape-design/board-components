// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function getNormalizedElementRect(element: HTMLElement): DOMRect {
  const { x, y, left, right, top, bottom, width, height } = element.getBoundingClientRect();
  const xOffset = element.ownerDocument.defaultView!.pageXOffset - window.scrollX;
  const yOffset = element.ownerDocument.defaultView!.pageYOffset - window.scrollY;
  return {
    x: x + xOffset,
    left: left + xOffset,
    right: right + xOffset,
    y: y + yOffset,
    top: top + yOffset,
    bottom: bottom + yOffset,
    width: width,
    height: height,
  } as DOMRect;
}
