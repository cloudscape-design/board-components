// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from "react";
import { vi } from "vitest";

import { ItemId } from "../../interfaces";
import { AcquireData, DragAndDropData, DragAndDropEvents } from "../controller";
import { EventEmitter } from "../event-emitter";

class MockController extends EventEmitter<DragAndDropEvents> {
  public start(event: DragAndDropData) {
    this.emit("start", event);
  }

  public update(event: DragAndDropData) {
    this.emit("update", event);
  }

  public submit() {
    this.emit("submit");
  }

  public discard() {
    this.emit("discard");
  }

  public acquire(event: AcquireData) {
    this.emit("acquire", event);
  }
}

export const mockController = new MockController();

// Records droppable IDs registered via useDroppable. Because placeholder IDs are scoped per board
// with a runtime-generated boardId, tests can use this to resolve the actual scoped ID instead of
// hardcoding it. Reset it between tests when needed.
export const mockDroppables = new Set<ItemId>();

export function useDragSubscription<K extends keyof DragAndDropEvents>(event: K, handler: DragAndDropEvents[K]) {
  useEffect(() => mockController.on(event, handler), [event, handler]);
}

export const mockDraggable = {
  start: vi.fn(),
  updateTransition: vi.fn(),
  submitTransition: vi.fn(),
  discardTransition: vi.fn(),
  getDroppables: vi.fn(),
} as any;

export function useDraggable() {
  return mockDraggable;
}

export function useDroppable({ itemId }: { itemId: ItemId }) {
  useEffect(() => {
    mockDroppables.add(itemId);
    return () => {
      mockDroppables.delete(itemId);
    };
  }, [itemId]);
}
