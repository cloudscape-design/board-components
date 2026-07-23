// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode, useRef } from "react";

import { DndControllerContext, DragAndDropController } from "./controller";

export interface DndContextProviderProps {
  children: ReactNode;
}

/**
 * Provides an isolated drag-and-drop controller to its subtree.
 *
 * All board components rendered within the same provider share one DnD context
 * and can therefore exchange items (e.g. drag between two boards, or from a
 * palette into a board). Components rendered in separate providers are isolated
 * from one another, which enables multiple independent Board instances on a
 * single page.
 *
 * The controller instance is created lazily and kept stable for the lifetime of
 * the provider so that subscriptions and droppable registrations remain valid
 * across re-renders.
 */
export function DndContextProvider({ children }: DndContextProviderProps) {
  const controllerRef = useRef<DragAndDropController>();
  if (!controllerRef.current) {
    controllerRef.current = new DragAndDropController();
  }
  return <DndControllerContext.Provider value={controllerRef.current}>{children}</DndControllerContext.Provider>;
}
