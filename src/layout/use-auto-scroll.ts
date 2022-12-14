// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import { useLastInteraction } from "../internal/utils/use-last-interaction";

export function useAutoScroll() {
  const [activeAutoScroll, setActiveAutoScroll] = useState<"up" | "down" | "none">("none");
  const [scrollIntoViewCounter, setScrollIntoViewCounter] = useState(0);
  const scrollIntoViewDelayRef = useRef(0);
  const getLastInteraction = useLastInteraction();

  // Scroll window repeatedly if activeAutoScroll="up" or activeAutoScroll="down".
  useEffect(() => {
    if (activeAutoScroll === "none") {
      return;
    }
    const direction = activeAutoScroll === "up" ? -1 : 1;

    let timer: ReturnType<typeof setTimeout>;

    function scrollLoop() {
      timer = setTimeout(() => {
        window.scrollBy({ top: direction * 5 });
        scrollLoop();
      }, 10);
    }
    scrollLoop();

    return () => clearTimeout(timer);
  }, [activeAutoScroll]);

  // Scrolls active element into view after a delay.
  useEffect(() => {
    if (scrollIntoViewCounter) {
      const activeElementBeforeDelay = document.activeElement;

      const timeoutId = setTimeout(() => {
        if (
          document.activeElement &&
          document.activeElement === activeElementBeforeDelay &&
          getLastInteraction() === "keyboard"
        ) {
          const rect = document.activeElement.getBoundingClientRect();
          if (
            rect.top < 0 ||
            rect.left < 0 ||
            rect.bottom > (window.innerHeight || document.documentElement.clientHeight) ||
            rect.right > (window.innerWidth || document.documentElement.clientWidth)
          ) {
            document.activeElement.scrollIntoView({ behavior: "smooth" });
          }
        }
      }, scrollIntoViewDelayRef.current);

      return () => clearTimeout(timeoutId);
    }
  }, [getLastInteraction, scrollIntoViewCounter]);

  const onPointerMove = useCallback((event: PointerEvent) => {
    const autoScrollMargin = 50;
    if (event.clientY > window.innerHeight - autoScrollMargin) {
      setActiveAutoScroll("down");
    } else if (event.clientY < autoScrollMargin) {
      setActiveAutoScroll("up");
    } else {
      setActiveAutoScroll("none");
    }
  }, []);

  const onPointerUp = useCallback(() => {
    setActiveAutoScroll("none");
  }, []);

  const addPointerEventHandlers = useCallback(() => {
    if (getLastInteraction() === "pointer") {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }
  }, [getLastInteraction, onPointerMove, onPointerUp]);

  const removePointerEventHandlers = useCallback(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove, onPointerUp]);

  const scheduleActiveElementScrollIntoView = useCallback((delay: number) => {
    scrollIntoViewDelayRef.current = delay;
    setScrollIntoViewCounter((prev) => prev + 1);
  }, []);

  return { addPointerEventHandlers, removePointerEventHandlers, scheduleActiveElementScrollIntoView };
}
