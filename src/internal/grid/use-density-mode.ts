// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { findUpUntil } from "@cloudscape-design/component-toolkit/dom";
import { useEffect, useState } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { useStableEventHandler } from "../utils/use-stable-event-handler";

// Matches: https://github.com/cloudscape-design/components/blob/main/src/internal/hooks/use-visual-mode/index.ts

export function useDensityMode(elementRef: React.RefObject<HTMLElement>) {
  const [value, setValue] = useState<"comfortable" | "compact">("comfortable");
  useMutationObserver(elementRef, (node) => {
    const compactModeParent = findUpUntil(
      node,
      (node) => node.classList.contains("awsui-polaris-compact-mode") || node.classList.contains("awsui-compact-mode")
    );
    setValue(compactModeParent ? "compact" : "comfortable");
  });
  return value;
}

const useMutationSingleton = createSingletonHandler<void>((handler) => {
  const observer = new MutationObserver(() => handler());
  observer.observe(document.body, { attributes: true, subtree: true });
  return () => observer.disconnect();
});

function useMutationObserver(elementRef: React.RefObject<HTMLElement>, onChange: (element: HTMLElement) => void) {
  const handler = useStableEventHandler(() => {
    if (elementRef.current) {
      onChange(elementRef.current);
    }
  });
  useMutationSingleton(handler);

  useEffect(() => {
    handler();
  }, [handler]);
}

type ValueCallback<T> = (value: T) => void;
type CleanupCallback = () => void;
type UseSingleton<T> = (listener: ValueCallback<T>) => void;

function createSingletonHandler<T>(factory: (handler: ValueCallback<T>) => CleanupCallback): UseSingleton<T> {
  const listeners: Array<ValueCallback<T>> = [];
  const callback: ValueCallback<T> = (value) => {
    unstable_batchedUpdates(() => {
      for (const listener of listeners) {
        listener(value);
      }
    });
  };
  let cleanup: (() => void) | undefined;

  return function useSingleton(listener: ValueCallback<T>) {
    useEffect(() => {
      if (listeners.length === 0) {
        cleanup = factory(callback);
      }
      listeners.push(listener);

      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
        if (listeners.length === 0) {
          cleanup!();
          cleanup = undefined;
        }
      };
      // register handlers only on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  };
}
