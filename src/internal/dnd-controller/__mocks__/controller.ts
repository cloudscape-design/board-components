// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from "react";
import { vi } from "vitest";
import { DragAndDropData, DragAndDropEvents } from "../controller";
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
}

export const mockController = new MockController();

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
