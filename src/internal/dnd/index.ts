// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Transform } from "@dnd-kit/utilities";
import { MouseEvent as ReactMouseEvent, Ref, useEffect, useRef, useState } from "react";
import { EventEmitter } from "./emitter";

type Updater = (event: MouseEvent) => void;

interface DragAndDropData {
  active: HTMLElement;
  activeId: string;
  droppables: Set<HTMLElement>;
  droppableIds: WeakMap<HTMLElement, string>;
}

interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  move: (data: DragAndDropData) => void;
  drop: (data: DragAndDropData) => void;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private droppables = new Set<HTMLElement>();
  private droppableIds = new WeakMap<HTMLElement, string>();
  private activeElement: HTMLElement | null = null;
  private activeId: string | null = null;
  private activeUpdater: Updater | null = null;

  private onMouseMove = (event: MouseEvent) => {
    this.activeUpdater!(event);
    this.emit("move", {
      active: this.activeElement!,
      activeId: this.activeId!,
      droppables: this.droppables,
      droppableIds: this.droppableIds,
    });
  };

  private onMouseUp = () => {
    this.emit("drop", {
      active: this.activeElement!,
      activeId: this.activeId!,
      droppables: this.droppables,
      droppableIds: this.droppableIds,
    });
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
    this.activeUpdater = null;
    this.activeElement = null;
    this.activeId = null;
  };

  public addDroppable(element: HTMLElement, id: string) {
    this.droppables.add(element);
    this.droppableIds.set(element, id);
  }

  public removeDroppable(element: HTMLElement) {
    this.droppables.delete(element);
    this.droppableIds.delete(element);
  }

  public activateDrag(activeElement: HTMLElement, activeId: string, updater: (event: MouseEvent) => void) {
    this.activeElement = activeElement;
    this.activeId = activeId;
    this.activeUpdater = updater;
    this.emit("start", {
      active: this.activeElement!,
      activeId: this.activeId!,
      droppables: this.droppables,
      droppableIds: this.droppableIds,
    });
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }
}

const controller = new DragAndDropController();

export function useDragSubscription(
  event: keyof DragAndDropEvents,
  handler: DragAndDropEvents[keyof DragAndDropEvents]
) {
  useEffect(() => controller.on(event, handler), [event, handler]);
}

export function useDraggable(id: string) {
  const ref = useRef<HTMLElement>();
  const [transform, setTransform] = useState<Transform | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useDragSubscription("start", ({ activeId }) => setActiveDragId(activeId));
  useDragSubscription("drop", () => {
    setActiveDragId(null);
    setTransform(null);
  });

  function onStart(event: ReactMouseEvent) {
    const el = ref.current;
    if (el) {
      const original = el.getBoundingClientRect();
      const offsetLeft = original.left - event.pageX;
      const offsetTop = original.top - event.pageY;
      controller.activateDrag(el, id, (event) => {
        setTransform({
          x: event.pageX - original.left + offsetLeft,
          y: event.pageY - original.top + offsetTop,
          scaleX: 1,
          scaleY: 1,
        });
      });
    }
  }
  return { ref: ref as Ref<any>, onStart, transform, activeDragId };
}

export function useDroppable(id: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      controller.addDroppable(el, id);
      return () => controller.removeDroppable(el);
    }
  }, [id]);

  return ref as Ref<any>;
}
