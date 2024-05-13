// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PointerEvent as ReactPointerEvent } from "react";

export function getNormalizedElementRect(element: HTMLElement): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
} {
  const { left, right, top, bottom, width, height } = getLogicalBoundingClientRect(element);
  const xOffset = element.ownerDocument.defaultView!.pageXOffset - window.scrollX;
  const yOffset = element.ownerDocument.defaultView!.pageYOffset - window.scrollY;
  return {
    left: left + xOffset,
    right: right + xOffset,
    top: top + yOffset,
    bottom: bottom + yOffset,
    width: width,
    height: height,
  };
}

// The below code is copied from components/src/internal/direction.ts

export function getLogicalBoundingClientRect(element: HTMLElement | SVGElement) {
  const boundingClientRect = element.getBoundingClientRect();

  const blockSize = boundingClientRect.height;
  const inlineSize = boundingClientRect.width;
  const insetBlockStart = boundingClientRect.top;
  const insetBlockEnd = boundingClientRect.bottom;
  const insetInlineStart = getIsRtl(element)
    ? document.documentElement.clientWidth - boundingClientRect.right
    : boundingClientRect.left;
  const insetInlineEnd = insetInlineStart + inlineSize;

  return {
    height: blockSize,
    width: inlineSize,
    top: insetBlockStart,
    bottom: insetBlockEnd,
    left: insetInlineStart,
    right: insetInlineEnd,
  };
}

export function getIsRtl(element: HTMLElement | SVGElement) {
  return getComputedStyle(element).direction === "rtl";
}

export function getOffsetInlineStart(element: HTMLElement) {
  const offsetParentWidth = element.offsetParent?.clientWidth ?? 0;
  return getIsRtl(element) ? offsetParentWidth - element.offsetWidth - element.offsetLeft : element.offsetLeft;
}

/**
 * The scrollLeft value will be a negative number if the direction is RTL and
 * needs to be converted to a positive value for direction independent scroll
 * computations. Additionally, the scrollLeft value can be a decimal value on
 * systems using display scaling requiring the floor and ceiling calls.
 */
export function getScrollInlineStart(element: HTMLElement) {
  return getIsRtl(element) ? Math.floor(element.scrollLeft) * -1 : Math.ceil(element.scrollLeft);
}

/**
 * The clientX position needs to be converted so it is relative to the right of
 * the document in order for computations to yield the same result in both
 * element directions.
 */
export function getLogicalClientX(event: PointerEvent | ReactPointerEvent<unknown>) {
  const isRtl = document.documentElement.dir === "rtl";
  return isRtl ? document.documentElement.clientWidth - event.clientX : event.clientX;
}
