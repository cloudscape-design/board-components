// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";

export interface BoardDndProviderProps {
  /**
   * The board components to render within a single, isolated drag-and-drop context.
   *
   * Any `Board` and `ItemsPalette` instances rendered inside the same
   * `BoardDndProvider` share one drag-and-drop context and can exchange items
   * with each other (for example, dragging an item from one board to another,
   * or from a palette into a board).
   *
   * Board components rendered in different `BoardDndProvider` instances are
   * isolated from one another, which is what enables multiple independent Board
   * instances on a single page.
   *
   * Board components rendered outside of any `BoardDndProvider` continue to use
   * the shared page-wide drag-and-drop context (the default, backwards-compatible
   * behavior).
   */
  children: ReactNode;
}
