// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { MouseEvent as ReactMouseEvent, Ref, RefObject, useEffect, useRef } from "react";
import { EventEmitter } from "./emitter";

interface DragDetail {
  id: string;
  containerRef: RefObject<HTMLElement>;
  resize: boolean;
}

export interface DragAndDropData extends DragDetail {
  droppables: readonly [string, HTMLElement][];
  coordinates: { x: number; y: number };
}

interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  move: (data: DragAndDropData) => void;
  drop: (data: DragAndDropData) => void;
}

function getCoordinates(event: ReactMouseEvent | MouseEvent) {
  return { x: event.pageX, y: event.pageY };
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private droppables = new Map<string, HTMLElement>();
  private activeDragDetail: DragDetail | null = null;

  private onMouseMove = (event: MouseEvent) => {
    this.emit("move", {
      ...this.activeDragDetail!,
      coordinates: getCoordinates(event),
      droppables: [...this.droppables.entries()],
    });
  };

  private onMouseUp = (event: MouseEvent) => {
    this.emit("drop", {
      ...this.activeDragDetail!,
      coordinates: getCoordinates(event),
      droppables: [...this.droppables.entries()],
    });
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
    this.activeDragDetail = null;
  };

  public addDroppable(element: HTMLElement, id: string) {
    this.droppables.set(id, element);
  }

  public removeDroppable(id: string) {
    this.droppables.delete(id);
  }

  public activateDrag(dragDetail: DragDetail, event: ReactMouseEvent) {
    this.activeDragDetail = dragDetail;
    this.emit("start", {
      ...this.activeDragDetail!,
      coordinates: getCoordinates(event),
      droppables: [...this.droppables.entries()],
    });
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }
}

const controller = new DragAndDropController();

export function useDragSubscription<K extends keyof DragAndDropEvents>(event: K, handler: DragAndDropEvents[K]) {
  useEffect(() => controller.on(event, handler), [event, handler]);
}

export function useDraggable(dragDetail: DragDetail) {
  return function onStart(event: ReactMouseEvent) {
    controller.activateDrag(dragDetail, event);
  };
}

export function useDroppable(id: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      controller.addDroppable(el, id);
      return () => controller.removeDroppable(id);
    }
  }, [id]);

  return ref as Ref<any>;
}
