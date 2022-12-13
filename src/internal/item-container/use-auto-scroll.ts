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

  return { onPointerMove, onPointerUp };
}
