// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import useBaseComponent from "../internal/base-component/use-base-component";
import { DndContextProvider } from "../internal/dnd-controller/dnd-context";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import type { BoardDndProviderProps } from "./interfaces";

import styles from "./styles.css.js";

export type { BoardDndProviderProps };

/**
 * `BoardDndProvider` establishes an isolated drag-and-drop context for the
 * `Board` (and optional `ItemsPalette`) components rendered within it.
 *
 * Use it to render multiple independent Board instances on the same page:
 * - Wrap each board in its own `BoardDndProvider` to fully isolate their
 *   drag-and-drop interactions.
 * - Wrap several boards (and/or a palette) in a single `BoardDndProvider` to let
 *   them share one context, so items can be dragged between them.
 *
 * Boards rendered without a `BoardDndProvider` keep the default page-wide
 * drag-and-drop context, preserving backwards compatibility.
 *
 * This component is additive and opt-in: existing usages that do not use it are
 * unaffected. The wrapper element uses `display: contents`, so it does not
 * affect the layout of the wrapped board components.
 */
export default function BoardDndProvider({ children, ...rest }: BoardDndProviderProps) {
  const baseComponentProps = useBaseComponent("BoardDndProvider");
  return (
    <div
      ref={baseComponentProps.__internalRootRef}
      className={clsx(styles.root)}
      {...getDataAttributes(rest as Record<string, string>)}
    >
      <DndContextProvider>{children}</DndContextProvider>
    </div>
  );
}

applyDisplayName(BoardDndProvider, "BoardDndProvider");
