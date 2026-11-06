// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";

import { useLastInteraction } from "./use-last-interaction";
const AUTO_SCROLL_INCREMENT = 5;
const AUTO_SCROLL_MARGIN = 50;
const AUTO_SCROLL_DELAY = 10;

export function useAutoScroll() {
  const getLastInteraction = useLastInteraction();
  const scrollControllerRef = useRef(new AutoScrollController(getLastInteraction));
  useEffect(() => scrollControllerRef.current.init(), []);
  return scrollControllerRef.current;
}

class AutoScrollController {
  private getLastInteraction: () => "pointer" | "keyboard";
  private active = false;
  private pointer: null | { x: number; y: number } = null;
  private scrollers: Element[] = [];
  private timeout = setTimeout(() => {}, 0);

  constructor(getLastInteraction: () => "pointer" | "keyboard") {
    this.getLastInteraction = getLastInteraction;
  }

  public init() {
    this.scrollRepeat();
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    return () => {
      clearTimeout(this.timeout);
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerUp);
    };
  }

  public run(element: HTMLElement) {
    this.active = true;
    // Scrollable parents of the board (nearest first), then the document.
    this.scrollers = [...getScrollableParents(element), document.scrollingElement ?? document.documentElement];
  }

  public stop() {
    this.active = false;
  }

  public scheduleActiveElementScrollIntoView(delay: number) {
    clearTimeout(this.timeout);

    const activeElementBeforeDelay = document.activeElement;
    this.timeout = setTimeout(() => {
      if (
        document.activeElement &&
        document.activeElement === activeElementBeforeDelay &&
        this.getLastInteraction() === "keyboard"
      ) {
        document.activeElement.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      }
      this.scrollRepeat();
    }, delay);
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.active) {
      return;
    }
    this.pointer = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = () => {
    this.pointer = null;
  };

  private scrollRepeat() {
    this.timeout = setTimeout(() => {
      if (this.active && this.pointer !== null) {
        for (const element of this.scrollers) {
          const direction = getScrollDirection(element, this.pointer);
          if (direction !== 0) {
            element.scrollBy({ top: direction * AUTO_SCROLL_INCREMENT });
            break;
          }
        }
      }
      this.scrollRepeat();
    }, AUTO_SCROLL_DELAY);
  }
}

// Collected by overflow style only: whether the content actually overflows is checked on every scroll
// step, because the board can grow during the drag and make a parent scrollable mid-operation.
function getScrollableParents(element: HTMLElement): Element[] {
  const parents: Element[] = [];
  for (let node = element.parentElement; node && node !== node.ownerDocument.body; node = node.parentElement) {
    if (["auto", "scroll"].includes(getComputedStyle(node).overflowY)) {
      parents.push(node);
    }
  }
  return parents;
}

// Returns the scroll direction when the pointer is within the margin of the element's visible edge (on either
// side of it, so that overshooting the edge keeps scrolling) and the element can still scroll that way.
function getScrollDirection(element: Element, pointer: { x: number; y: number }): 0 | -1 | 1 {
  // The document's box can be shorter than the viewport (e.g. html { height: 100% }), so the viewport is its rect.
  const rect =
    element === (document.scrollingElement ?? document.documentElement)
      ? { top: 0, bottom: window.innerHeight, left: -Infinity, right: Infinity }
      : element.getBoundingClientRect();
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  if (pointer.x < rect.left || pointer.x > rect.right) {
    return 0;
  }
  if (pointer.y < top - AUTO_SCROLL_MARGIN || pointer.y > bottom + AUTO_SCROLL_MARGIN) {
    return 0;
  }
  // When less than two margins are visible the edge zones would overlap, so the nearer edge wins.
  const middle = (top + bottom) / 2;
  const canScrollDown = Math.ceil(element.scrollTop + element.clientHeight) < element.scrollHeight;
  if (pointer.y > Math.max(bottom - AUTO_SCROLL_MARGIN, middle) && canScrollDown) {
    return 1;
  }
  if (pointer.y < Math.min(top + AUTO_SCROLL_MARGIN, middle) && element.scrollTop > 0) {
    return -1;
  }
  return 0;
}
