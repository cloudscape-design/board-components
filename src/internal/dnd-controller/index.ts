// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from "react";
import { Coordinates, DashboardItemBase, ItemId } from "../interfaces";
import { getCoordinates } from "../utils/get-coordinates";
import { getHoveredDroppables } from "./collision";
import { EventEmitter } from "./event-emitter";

type Scale = (size: { width: number; height: number }) => { width: number; height: number };

export interface DragAndDropData extends DragDetail {
  cursorOffset: Coordinates;
  collisionIds: ItemId[];
  dropTarget: null | { scale: Scale };
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

interface Transition extends DragDetail {
  startCoordinates: Coordinates;
  startScroll: Coordinates;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private droppables = new Map<ItemId, Droppable>();
  private transition: null | Transition = null;

  public activateDrag(dragDetail: DragDetail, coordinates: Coordinates, type: "pointer" | "manual") {
    this.transition = {
      ...dragDetail,
      startCoordinates: coordinates,
      startScroll: { __type: "Coordinates", x: window.scrollX, y: window.scrollY },
    };

    this.emit("start", this.getDragAndDropData(coordinates));

    if (type === "pointer") {
      document.addEventListener("pointermove", this.onPointerMove);
      document.addEventListener("pointerup", this.onPointerUp);
    }
  }

  public cancel() {
    this.emit("drop", this.getDragAndDropData(this.transition!.startCoordinates));
    this.transition = null;
  }

  public addDroppable(id: string, scale: Scale, element: HTMLElement) {
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
    this.transition = null;
  };

  private getDragAndDropData(coordinates: Coordinates): DragAndDropData {
    if (!this.transition) {
      throw new Error("Invariant violation: no transition present for interaction.");
    }
    const { operation, draggableItem, draggableElement, draggableSize, startCoordinates, startScroll } =
      this.transition;
    const cursorOffset = {
      ...coordinates,
      x: coordinates.x - startCoordinates.x + (window.scrollX - startScroll.x),
      y: coordinates.y - startCoordinates.y + (window.scrollY - startScroll.y),
    };
    const { collisionIds, dropTarget } = this.getCollisions(operation, draggableElement, coordinates);
    return { operation, draggableItem, draggableElement, draggableSize, cursorOffset, collisionIds, dropTarget };
  }

  private getCollisions(operation: "move" | "resize", draggableElement: HTMLElement, coordinates: Coordinates) {
    const droppableEntries = [...this.droppables.entries()];
    const droppableElements: [ItemId, HTMLElement][] = droppableEntries.map(([id, entry]) => [id, entry.element]);
    const collisionIds = getHoveredDroppables(operation, draggableElement, coordinates, droppableElements);
    if (collisionIds.length === 0) {
      return { collisionIds, dropTarget: null };
    }

    const matchedDroppable = droppableEntries.find(([id]) => id === collisionIds[0]);
    if (!matchedDroppable) {
      throw new Error("Invariant violation: no droppable matches collision.");
    }
    return { collisionIds, dropTarget: { scale: matchedDroppable[1].scale } };
  }
}

// Controller is a singleton and is shared between all d&d elements.
const controller = new DragAndDropController();

export function useDragSubscription<K extends keyof DragAndDropEvents>(event: K, handler: DragAndDropEvents[K]) {
  useEffect(() => controller.on(event, handler), [event, handler]);
}

export function useDraggable({
  item,
  getElement,
}: {
  item: DashboardItemBase<unknown>;
  getElement: () => HTMLElement;
}) {
  return {
    startMove(coordinates: Coordinates, type: "pointer" | "manual") {
      const operation = "move";
      const draggableElement = getElement();
      const draggableSize = draggableElement.getBoundingClientRect();
      controller.activateDrag({ operation, draggableItem: item, draggableElement, draggableSize }, coordinates, type);
    },
    startResize(coordinates: Coordinates, type: "pointer" | "manual") {
      const operation = "resize";
      const draggableElement = getElement();
      const draggableSize = draggableElement.getBoundingClientRect();
      controller.activateDrag({ operation, draggableItem: item, draggableElement, draggableSize }, coordinates, type);
    },
    endTransition() {
      controller.cancel();
    },
  };
}

export function useDroppable({
  itemId,
  scale,
  getElement,
}: {
  itemId: ItemId;
  scale: Scale;
  getElement: () => HTMLElement;
}) {
  useEffect(() => {
    controller.addDroppable(itemId, scale, getElement());
    return () => controller.removeDroppable(itemId);
  }, [itemId, scale, getElement]);
}
