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

// Shared instance so tests can assert on cross-board transfer calls (e.g. acquire on a foreign
// droppable) regardless of how many times the hook re-runs across renders.
export const mockBoardTransfer = {
  acquire: vi.fn(),
  getDroppables: vi.fn(() => [...mockDroppables].map((id) => [id, { element: document.body, context: {} }])),
};

export function useBoardTransfer() {
  return mockBoardTransfer;
}

export function useDroppable({ itemId }: { itemId: ItemId }) {
  useEffect(() => {
    mockDroppables.add(itemId);
    return () => {
      mockDroppables.delete(itemId);
    };
  }, [itemId]);
}
