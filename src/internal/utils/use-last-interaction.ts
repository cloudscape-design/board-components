// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef } from "react";

export function useLastInteraction() {
  const lastInteractionRef = useRef<"pointer" | "keyboard">("pointer");

  useEffect(() => {
    const onPointerDown = () => {
      lastInteractionRef.current = "pointer";
    };
    const onKeyDown = () => {
      lastInteractionRef.current = "keyboard";
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const getLastEvent = useCallback(() => lastInteractionRef.current, []);

  return getLastEvent;
}
