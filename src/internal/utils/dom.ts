// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Returns all fixed/sticky element DOM rects from the page.
 */
export function queryFixedRects(target: HTMLElement): readonly DOMRect[] {
  const rects: DOMRect[] = [];

  const allElements = document.querySelectorAll("*");
  for (let index = 0; index < allElements.length; index++) {
    const element = allElements[index];
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    // Ignore fixed rects that belong to the target item as irrelevant for matching against.
    if (target.contains(element)) {
      continue;
    }
    const computedStyle = getComputedStyle(element);
    const isDisplayed = computedStyle.display !== "none";
    const isFixedOrSticky = computedStyle.position === "fixed" || computedStyle.position === "sticky";
    const isPointerEventsAllowed = computedStyle.pointerEvents !== "none";
    if (isDisplayed && isFixedOrSticky && isPointerEventsAllowed) {
      rects.push(element.getBoundingClientRect());
    }
  }

  return rects.filter((rect) => rect.width > 0 && rect.height > 0);
}
