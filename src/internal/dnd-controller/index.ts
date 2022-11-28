// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Ref, RefObject, useEffect, useRef } from "react";
import { Coordinates, DashboardItemBase } from "../interfaces";
import { EventEmitter } from "./event-emitter";

export interface DragAndDropData extends DragDetail {
  droppables: readonly [string, HTMLElement][];
  coordinates: Coordinates;
}

interface DragDetail {
  item: DashboardItemBase<unknown>;
  containerRef: RefObject<HTMLElement>;
  resize: boolean;
}

interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  move: (data: DragAndDropData) => void;
  drop: (data: DragAndDropData) => void;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private droppables = new Map<string, HTMLElement>();
  private activeDragDetail: DragDetail | null = null;

  public activateDrag(dragDetail: DragDetail, coordinates: Coordinates) {
    this.activeDragDetail = dragDetail;
    this.emit("start", { ...this.activeDragDetail, coordinates, droppables: [...this.droppables.entries()] });
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
  }

  public addDroppable(element: HTMLElement, id: string) {
    this.droppables.set(id, element);
  }

  public removeDroppable(id: string) {
    this.droppables.delete(id);
  }

  private onPointerMove = (coordinates: Coordinates) => {
    if (!this.activeDragDetail) {
      throw new Error("Invariant violation: no active drag detail present for move.");
    }
    this.emit("move", { ...this.activeDragDetail, coordinates, droppables: [...this.droppables.entries()] });
  };

  private onPointerUp = (coordinates: Coordinates) => {
    if (!this.activeDragDetail) {
      throw new Error("Invariant violation: no active drag detail present for drop.");
    }
    this.emit("drop", { ...this.activeDragDetail, coordinates, droppables: [...this.droppables.entries()] });
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
    this.activeDragDetail = null;
  };
}

// Controller is a singleton and is shared between all d&d elements.
const controller = new DragAndDropController();

export function useDragSubscription<K extends keyof DragAndDropEvents>(event: K, handler: DragAndDropEvents[K]) {
  useEffect(() => controller.on(event, handler), [event, handler]);
}

export function useDraggable(dragDetail: DragDetail) {
  return {
    onStart(coordinates: Coordinates) {
      controller.activateDrag(dragDetail, coordinates);
    },
  };
}

export function useDroppable(id: string) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      controller.addDroppable(ref.current, id);
      return () => controller.removeDroppable(id);
    }
  }, [id]);

  return ref as Ref<any>;
}
