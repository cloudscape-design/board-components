// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/** Temporarily taken from Component Toolkit until available in NPM */
import { ResizeObserver, ResizeObserverEntry } from "@juggle/resize-observer";
import { useRef, useEffect, useLayoutEffect, useState, useCallback, DependencyList, Ref, RefObject } from "react";

/**
 * A callback that stays stable between renders even as the dependencies change.
 * Not a recommended React pattern, so it should be used sparingly and only if
 * the callback is used asynchronously (i.e. not used during rendering) and causing
 * clear performance issues.
 *
 * @remarks
 *
 * The implementation ensures the callback cannot be called synchronously. All synchronous calls
 * (during rendering) are ignored.
 *
 * @example
 * Use stable onMouseMove handler
 * ```
 * function Demo({ args }) {
 *   const stableOnMouseMove = useStableCallback((event) => makeAction(event, args))
 *   return <Container onMouseMove={stableOnMouseMove} />
 * }
 * ```
 *
 * @see https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
 *
 * @typeParam Callback The callback to be made stable
 * @returns Stable callback
 */
function useStableCallback<Callback extends (...args: any[]) => any>(fn: Callback): Callback {
  const ref = useRef<Callback>();

  useEffect(() => {
    ref.current = fn;
  });

  return useCallback((...args: any[]) => ref.current?.apply(undefined, args), []) as Callback;
}

/**
 * Simplified version of ResizeObserverEntry
 */
export interface ContainerQueryEntry {
  /** Target element */
  target: Element;
  /** Element's content box width */
  contentBoxWidth: number;
  /** Element's content box height */
  contentBoxHeight: number;
  /** Element's border box width */
  borderBoxWidth: number;
  /** Element's border box height */
  borderBoxHeight: number;
}

/**
 * React reference or element callback
 */
export type ElementReference = (() => Element | null) | RefObject<Element>;

/**
 * Attaches resize-observer to the referenced element.
 *
 * @remarks
 *
 * The hook has no control over the referenced element. It is up to the consumer to ensure
 * the element lifecycle and notify the hook by updating the `elementRef`.
 *
 * @example
 * With React reference
 * ```
 * const ref = useRef(null)
 * useResizeObserver(ref, (entry) => setState(getWidth(entry)))
 * ```
 *
 * @example
 * With ID reference
 * ```
 * const getElement = useCallback(() => document.getElementById(id), [id])
 * useResizeObserver(getElement, (entry) => setState(getWidth(entry)))
 * ```
 *
 * @param elementRef React reference or memoized getter for the target element
 * @param onObserve Function to fire when observation occurs
 */
function useResizeObserver(elementRef: ElementReference, onObserve: (entry: ContainerQueryEntry) => void) {
  const stableOnObserve = useStableCallback(onObserve);

  // This effect provides a synchronous update required to prevent flakiness when initial state and first observed state are different.
  // Can potentially conflict with React concurrent mode: https://17.reactjs.org/docs/concurrent-mode-intro.html.
  // TODO: A possible solution would be to make consumers not render any content until the first (asynchronous) observation is available.
  useLayoutEffect(
    () => {
      const element = typeof elementRef === "function" ? elementRef() : elementRef?.current;
      if (element) {
        onObserve(convertResizeObserverEntry(new ResizeObserverEntry(element)));
      }
    },
    // This effect is only needed for the first render to provide a synchronous update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const element = typeof elementRef === "function" ? elementRef() : elementRef?.current;
    if (element) {
      let connected = true;
      const observer = new ResizeObserver((entries) => {
        // Prevent observe notifications on already unmounted component.
        if (connected) {
          stableOnObserve(convertResizeObserverEntry(entries[0]));
        }
      });
      observer.observe(element);
      return () => {
        connected = false;
        observer.disconnect();
      };
    }
  }, [elementRef, stableOnObserve]);
}

function convertResizeObserverEntry(entry: ResizeObserverEntry): ContainerQueryEntry {
  return {
    target: entry.target,
    contentBoxWidth: entry.contentBoxSize[0].inlineSize,
    contentBoxHeight: entry.contentBoxSize[0].blockSize,
    borderBoxWidth: entry.borderBoxSize[0].inlineSize,
    borderBoxHeight: entry.borderBoxSize[0].blockSize,
  };
}

/**
 * Attaches resize-observer to the referenced element and keeps last observation in state.
 * The hook allows to limit the amount of re-renders to only when the observed value changes.
 *
 * @example
 * Switching display mode under a given condition (only re-renders when mode changes):
 * ```
 * const [smallMode, ref] = useContainerQuery(entry => entry.contentBoxHeight <= smallModeHeight, [smallModeHeight])
 * ```
 *
 * @example
 * Obtaining observer entry (re-renders with each observation):
 * ```
 * const [entry, ref] = useContainerQuery(entry => entry)
 * ```
 *
 * @example
 * Using previous state to avoid unnecessary re-renders:
 * ```
 * const [value, ref] = useContainerQuery((entry, prev) => shouldUpdate(entry) ? getValue(entry) : prev)
 * ```
 *
 * @typeParam ObservedState State obtained from the last observation
 * @param mapFn Function to convert ContainerQueryEntry to ObservedState
 * @param deps Dependency list to indicate when the mapFn changes
 * @returns A tuple of the observed state and a reference to be attached to the target element
 */
export default function useContainerQuery<ObservedState>(
  mapFn: (entry: ContainerQueryEntry, prev: null | ObservedState) => ObservedState,
  deps: DependencyList = []
): [null | ObservedState, Ref<HTMLElement>] {
  const elementRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<null | ObservedState>(null);

  // Update getElement when deps change to trigger new observation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getElement = useCallback(() => elementRef.current, deps);

  useResizeObserver(getElement, (entry) => setState((prevState) => mapFn(entry, prevState)));

  return [state, elementRef];
}
