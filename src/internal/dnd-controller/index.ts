// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Ref, useEffect, useRef } from "react";
import { Coordinates, DashboardItemBase, ItemId } from "../interfaces";
import { getCoordinates } from "../utils/get-coordinates";
import { getHoveredDroppables } from "./collision";
import { EventEmitter } from "./event-emitter";

type Scale = (size: { width: number; height: number }) => { width: number; height: number };

export interface DragAndDropData extends DragDetail {
  cursorOffset: Coordinates;
  collisionIds: ItemId[];
  dropTarget?: { scale: Scale };
}

interface Droppable {
  element: HTMLElement;
  scale: Scale;
}

interface DragDetail {
  operation: "move" | "resize";
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
  draggableSize: { width: number; height: number };
}

interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  move: (data: DragAndDropData) => void;
  drop: (data: DragAndDropData) => void;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private droppables = new Map<ItemId, Droppable>();
  private activeDragDetail: null | DragDetail = null;
  private startCoordinates: null | Coordinates = null;

  public activateDrag(dragDetail: DragDetail, coordinates: Coordinates) {
    this.activeDragDetail = { ...dragDetail, draggableSize: dragDetail.draggableElement.getBoundingClientRect() };
    this.startCoordinates = { ...coordinates };
    this.emit("start", this.getDragAndDropData(coordinates));
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
  }

  public addDroppable(id: string, element: HTMLElement, scale: Scale) {
    this.droppables.set(id, { element, scale });
  }

  public removeDroppable(id: string) {
    this.droppables.delete(id);
  }

  private onPointerMove = (event: PointerEvent) => {
    this.emit("move", this.getDragAndDropData(getCoordinates(event)));
  };

  private onPointerUp = (event: PointerEvent) => {
    this.emit("drop", this.getDragAndDropData(getCoordinates(event)));
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
    this.activeDragDetail = null;
    this.startCoordinates = null;
  };

  private getDragAndDropData(coordinates: Coordinates): DragAndDropData {
    if (!this.activeDragDetail || !this.startCoordinates) {
      throw new Error("Invariant violation: no active drag detail present interaction.");
    }
    const { operation, draggableItem, draggableElement, draggableSize } = this.activeDragDetail;
    const cursorOffset = {
      ...coordinates,
      x: coordinates.x - this.startCoordinates.x,
      y: coordinates.y - this.startCoordinates.y,
    };
    const { collisionIds, dropTarget } = this.getCollisions(operation, draggableElement, coordinates);
    return { operation, draggableItem, draggableElement, draggableSize, cursorOffset, collisionIds, dropTarget };
  }

  private getCollisions(operation: "move" | "resize", draggableElement: HTMLElement, coordinates: Coordinates) {
    const droppableEntries = [...this.droppables.entries()];
    const droppableElements: [ItemId, HTMLElement][] = droppableEntries.map(([id, entry]) => [id, entry.element]);
    const collisionIds = getHoveredDroppables(operation, draggableElement, coordinates, droppableElements);
    const scale = droppableEntries.find(([id]) => id === collisionIds[0])?.[1].scale;
    return { collisionIds, dropTarget: scale && { scale } };
  }
}

// Controller is a singleton and is shared between all d&d elements.
const controller = new DragAndDropController();

export function useDragSubscription<K extends keyof DragAndDropEvents>(event: K, handler: DragAndDropEvents[K]) {
  useEffect(() => controller.on(event, handler), [event, handler]);
}

export function useDraggable({
  item,
  operation,
  getElement,
}: {
  item: DashboardItemBase<unknown>;
  operation: "move" | "resize";
  getElement: () => HTMLElement;
}) {
  return {
    onStart(coordinates: Coordinates) {
      const draggableElement = getElement();
      const draggableSize = { width: 0, height: 0 };
      controller.activateDrag({ operation, draggableItem: item, draggableElement, draggableSize }, coordinates);
    },
  };
}

export function useDroppable(id: string, scale: Scale) {
  const ref = useRef<HTMLElement>(null);

  useEffect(
    () => {
      if (ref.current) {
        controller.addDroppable(id, ref.current, scale);
        return () => controller.removeDroppable(id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  return ref as Ref<any>;
}
