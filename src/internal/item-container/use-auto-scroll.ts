// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";

export function useAutoScroll() {
  const [activeAutoScroll, setActiveAutoScroll] = useState<"up" | "down" | "none">("none");

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

  const onManualMove = useCallback(() => {
    const timeoutId = setTimeout(() => {
      const element = document.activeElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        if (
          rect.top < 0 ||
          rect.left < 0 ||
          rect.bottom > (window.innerHeight || document.documentElement.clientHeight) ||
          rect.right > (window.innerWidth || document.documentElement.clientWidth)
        ) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  return { onPointerMove, onPointerUp, onManualMove };
}
