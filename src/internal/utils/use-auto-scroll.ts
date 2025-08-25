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
  private direction: 0 | -1 | 1 = 0;
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

  public run() {
    this.active = true;
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
    if (event.clientY > window.innerHeight - AUTO_SCROLL_MARGIN) {
      this.direction = 1;
    } else if (event.clientY < AUTO_SCROLL_MARGIN) {
      this.direction = -1;
    } else {
      this.direction = 0;
    }
  };

  private onPointerUp = () => {
    this.direction = 0;
  };

  private scrollRepeat() {
    this.timeout = setTimeout(() => {
      if (this.active && this.direction !== 0) {
        window.scrollBy({ top: this.direction * AUTO_SCROLL_INCREMENT });
      }
      this.scrollRepeat();
    }, AUTO_SCROLL_DELAY);
  }
}
