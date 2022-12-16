// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from "react";
import { DashboardItemBase, ItemId, Rect } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { getCollisionRect, getHoveredDroppables } from "./collision";
import { EventEmitter } from "./event-emitter";

export type Operation = "reorder" | "resize" | "insert";

/**
 * Represents the relations between droppables and draggables.
 *
 * The `scale` function transforms draggable's width/height in relative units
 * to the absolute width/height in pixels the droppable expects.
 *
 * The `acquire` function notifies the droppable of the intention to drop the item to it.
 */
export interface DropTargetContext {
  scale: (size: { width: number; height: number }) => { width: number; height: number };
  acquire: () => void;
}

export interface DragAndDropData {
  operation: Operation;
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
  positionOffset: Coordinates;
  coordinates: Coordinates;
  collisionRect: Rect;
  collisionIds: ItemId[];
  dropTarget: null | DropTargetContext;
}

export interface Droppable {
  element: HTMLElement;
  context: DropTargetContext;
}

interface DragDetail {
  operation: Operation;
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
}

interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  update: (data: DragAndDropData) => void;
  submit: () => void;
  discard: () => void;
}

interface Transition extends DragDetail {
  startCoordinates: Coordinates;
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
      startCoordinates,
    };
    this.emit("start", this.getDragAndDropData(startCoordinates));
  }

  public update(coordinates: Coordinates) {
    this.emit("update", this.getDragAndDropData(coordinates));
  }

  public submit() {
    this.emit("submit");
    this.transition = null;
  }

  public discard() {
    this.emit("discard");
    this.transition = null;
  }

  public addDroppable(id: ItemId, context: DropTargetContext, element: HTMLElement) {
    this.droppables.set(id, { element, context });
  }

  public removeDroppable(id: ItemId) {
    this.droppables.delete(id);
  }

  public getDroppables() {
    return [...this.droppables.entries()];
  }

  private getDragAndDropData(coordinates: Coordinates): DragAndDropData {
    if (!this.transition) {
      throw new Error("Invariant violation: no transition present for interaction.");
    }
    const { operation, draggableElement, startCoordinates } = this.transition;
    const positionOffset = Coordinates.cursorOffset(coordinates, startCoordinates);
    const collisionRect = getCollisionRect(operation, draggableElement, coordinates);
    const { collisionIds, dropTarget } = this.getCollisions(collisionRect);
    return { ...this.transition, positionOffset, coordinates, collisionRect, collisionIds, dropTarget };
  }

  private getCollisions(collisionRect: Rect) {
    const droppableEntries = [...this.droppables.entries()];
    const droppableElements: [ItemId, HTMLElement][] = droppableEntries.map(([id, entry]) => [id, entry.element]);
    const collisionIds = getHoveredDroppables(collisionRect, droppableElements);
    if (collisionIds.length === 0) {
      return { collisionIds, dropTarget: null };
    }

    const matchedDroppable = droppableEntries.find(([id]) => id === collisionIds[0]);
    if (!matchedDroppable) {
      throw new Error("Invariant violation: no droppable matches collision.");
    }
    return { collisionIds, dropTarget: matchedDroppable[1].context };
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
  context,
  getElement,
}: {
  itemId: ItemId;
  context: DropTargetContext;
  getElement: () => HTMLElement;
}) {
  useEffect(() => {
    controller.addDroppable(itemId, context, getElement());
    return () => controller.removeDroppable(itemId);
  }, [itemId, context, getElement]);
}
