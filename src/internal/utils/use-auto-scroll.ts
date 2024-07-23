// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";

import { useLastInteraction } from "./use-last-interaction";

export function useAutoScroll() {
  const [activeAutoScroll, setActiveAutoScroll] = useState<"up" | "down" | "none">("none");
  const scrollIntoViewTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
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

  const scheduleActiveElementScrollIntoView = useCallback(
    (delay: number) => {
      scrollIntoViewTimerRef.current && clearTimeout(scrollIntoViewTimerRef.current);

      const activeElementBeforeDelay = document.activeElement;

      scrollIntoViewTimerRef.current = setTimeout(() => {
        if (
          document.activeElement &&
          document.activeElement === activeElementBeforeDelay &&
          getLastInteraction() === "keyboard"
        ) {
          document.activeElement.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
        }
      }, delay);
    },
    [getLastInteraction],
  );

  return { addPointerEventHandlers, removePointerEventHandlers, scheduleActiveElementScrollIntoView };
}
