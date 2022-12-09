// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from "react";
import { Coordinates, DashboardItemBase, ItemId } from "../interfaces";
import { getHoveredDroppables } from "./collision";
import { EventEmitter } from "./event-emitter";

export type Operation = "reorder" | "resize" | "insert";

export type Scale = (size: { width: number; height: number }) => { width: number; height: number };

export interface DragAndDropData extends DragDetail {
  cursorOffset: Coordinates;
  collisionIds: ItemId[];
  dropTarget: null | { scale: Scale };
}

export interface Droppable {
  element: HTMLElement;
  scale: Scale;
}

interface DragDetail {
  operation: Operation;
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
  draggableSize: { width: number; height: number };
}

interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  update: (data: DragAndDropData) => void;
  submit: (data: DragAndDropData) => void;
  discard: (data: DragAndDropData) => void;
}

interface Transition extends DragDetail {
  startCoordinates: Coordinates;
  lastCoordinates: Coordinates;
  startScroll: Coordinates;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private droppables = new Map<ItemId, Droppable>();
  private transition: null | Transition = null;

  public start(
    operation: Operation,
    draggableItem: DashboardItemBase<unknown>,
    draggableElement: HTMLElement,
    startCoordinates: Coordinates
  ) {
    this.transition = {
      operation,
      draggableItem,
      draggableElement,
      draggableSize: draggableElement.getBoundingClientRect(),
      startCoordinates,
      lastCoordinates: startCoordinates,
      startScroll: { __type: "Coordinates", x: window.scrollX, y: window.scrollY },
    };
    this.emit("start", this.getDragAndDropData(startCoordinates));
  }

  public update(coordinates: Coordinates) {
    this.emit("update", this.getDragAndDropData(coordinates));
    this.transition!.lastCoordinates = coordinates;
  }

  public submit() {
    this.emit("submit", this.getDragAndDropData());
    this.transition = null;
  }

  public discard() {
    this.emit("discard", this.getDragAndDropData());
    this.transition = null;
  }

  public addDroppable(id: ItemId, scale: Scale, element: HTMLElement) {
    this.droppables.set(id, { element, scale });
  }

  public removeDroppable(id: ItemId) {
    this.droppables.delete(id);
  }

  public getDroppables() {
    return [...this.droppables.entries()];
  }

  private getDragAndDropData(coordinates?: Coordinates): DragAndDropData {
    if (!this.transition) {
      throw new Error("Invariant violation: no transition present for interaction.");
    }
    coordinates = coordinates ?? this.transition.lastCoordinates;

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

  private getCollisions(operation: Operation, draggableElement: HTMLElement, coordinates: Coordinates) {
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
    start(operation: Operation, startCoordinates: Coordinates) {
      controller.start(operation, item, getElement(), startCoordinates);
    },
    updateTransition(coordinates: Coordinates) {
      controller.update(coordinates);
    },
    submitTransition() {
      controller.submit();
    },
    discardTransition() {
      controller.discard();
    },
    getDroppables() {
      return controller.getDroppables();
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
