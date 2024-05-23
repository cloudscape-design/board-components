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

export function useIsRtl(elementRef: React.RefObject<Element>) {
  const getIsRtl = (): boolean =>
    elementRef.current && elementRef.current instanceof Element
      ? getComputedStyle(elementRef.current).direction === "rtl"
      : false;
  return getIsRtl;
}

/**
 * The clientX position needs to be converted so it is relative to the right of
 * the document in order for computations to yield the same result in both
 * element directions.
 */
export function getLogicalClientX(event: PointerEvent | ReactPointerEvent<unknown>, isRtl: boolean) {
  return isRtl ? document.documentElement.clientWidth - event.clientX : event.clientX;
}

/**
 * The getBoundingClientRect() function returns values relative to the top left
 * corner of the document regardless of document direction. The left/right position
 * will be transformed to insetInlineStart based on element direction in order to
 * support direction agnostic position computation.
 */
export function getLogicalBoundingClientRect(element: HTMLElement | SVGElement) {
  const boundingClientRect = element.getBoundingClientRect();

  const blockSize = boundingClientRect.height;
  const inlineSize = boundingClientRect.width;
  const insetBlockStart = boundingClientRect.top;
  const insetBlockEnd = boundingClientRect.bottom;
  const insetInlineStart =
    element instanceof Element && getComputedStyle(element).direction === "rtl"
      ? document.documentElement.clientWidth - boundingClientRect.right
      : boundingClientRect.left;
  const insetInlineEnd = insetInlineStart + inlineSize;

  return {
    blockSize,
    inlineSize,
    insetBlockStart,
    insetBlockEnd,
    insetInlineStart,
    insetInlineEnd,
  };
}
