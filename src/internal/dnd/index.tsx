// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Transform } from "@dnd-kit/utilities";
import { Ref, useEffect, useRef, useState } from "react";

type Listener = (state: {
  active: HTMLElement;
  activeData: any;
  droppables: Set<HTMLElement>;
  dropData: WeakMap<HTMLElement, any>;
}) => void;

type Updater = (event: MouseEvent) => void;

class DragAndDropController {
  private droppables = new Set<HTMLElement>();
  private dropData = new WeakMap<HTMLElement, any>();
  private activeElement: HTMLElement | null = null;
  private activeData: any = null;
  private activeUpdater: Updater = () => {};

  private onStartListeners: Array<Listener> = [];
  private onMoveListeners: Array<Listener> = [];
  private onDropListeners: Array<Listener> = [];

  private onMouseMove = (event: MouseEvent) => {
    this.activeUpdater(event);
    this.notify(this.onMoveListeners);
  };
  private onMouseUp = () => {
    this.notify(this.onDropListeners);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
    this.activeElement = null;
  };

  private notify(listeners: Array<Listener>) {
    for (const listener of listeners) {
      listener({
        active: this.activeElement!,
        activeData: this.activeData,
        droppables: this.droppables,
        dropData: this.dropData,
      });
    }
  }

  public addDroppable(element: HTMLElement, data: any) {
    this.droppables.add(element);
    this.dropData.set(element, data);
  }

  public removeDroppable(element: HTMLElement) {
    this.droppables.delete(element);
    this.dropData.delete(element);
  }

  public activateDrag(activeElement: HTMLElement, activeData: any, updater: (event: MouseEvent) => void) {
    this.activeElement = activeElement;
    this.activeData = activeData;
    this.activeUpdater = updater;
    this.notify(this.onStartListeners);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  public listen(onStart: Listener, onMove: Listener, onDrop: Listener) {
    this.onStartListeners.push(onStart);
    this.onMoveListeners.push(onMove);
    this.onDropListeners.push(onDrop);
  }

  public unlisten(onStart: Listener, onMove: Listener, onDrop: Listener) {
    this.onStartListeners = this.onStartListeners.filter((l) => l !== onMove);
    this.onMoveListeners = this.onMoveListeners.filter((l) => l !== onMove);
    this.onDropListeners = this.onDropListeners.filter((l) => l !== onDrop);
  }
}

const controller = new DragAndDropController();

export function useDragState(onStart: Listener, onMove: Listener, onDrop: Listener) {
  useEffect(() => {
    controller.listen(onStart, onMove, onDrop);
    return () => controller.unlisten(onStart, onMove, onDrop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useDraggable(id: string) {
  const ref = useRef<HTMLElement>();
  const [transform, setTransform] = useState<Transform | null>(null);
  const [currentDragId, setCurrentDragId] = useState<string | null>(null);

  useDragState(
    ({ activeData }) => setCurrentDragId(activeData),
    () => {},
    () => {
      setCurrentDragId(null);
      setTransform(null);
    }
  );

  function onStart() {
    const el = ref.current;
    if (el) {
      const original = el.getBoundingClientRect();
      controller.activateDrag(el, id, (event) => {
        setTransform({ x: event.pageX - original.left, y: event.pageY - original.top, scaleX: 1, scaleY: 1 });
      });
    }
  }
  return {
    setNodeRef: (el: any) => (ref.current = el),
    listeners: {
      onMouseDown: onStart,
    },
    transform,
    currentDragId,
  };
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
