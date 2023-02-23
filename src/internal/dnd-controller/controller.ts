// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from "react";
import { BoardItemDefinitionBase, ItemId, Rect } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { getCollisionRect, getHoveredDroppables } from "./collision";
import { EventEmitter } from "./event-emitter";

export type Operation = "reorder" | "resize" | "insert";

export type InteractionType = "pointer" | "keyboard";

/**
 * Represents the relations between droppables and draggables.
 *
 * The `scale` function transforms draggable's width/height in relative units
 * to the absolute width/height in pixels the droppable expects.
 */
export interface DropTargetContext {
  scale: (size: { width: number; height: number }) => { width: number; height: number };
}

export interface DragAndDropData {
  operation: Operation;
  interactionType: InteractionType;
  draggableItem: BoardItemDefinitionBase<unknown>;
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
  interactionType: InteractionType;
  draggableItem: BoardItemDefinitionBase<unknown>;
  draggableElement: HTMLElement;
}

interface AcquireData {
  droppableId: ItemId;
  draggableItem: BoardItemDefinitionBase<unknown>;
}

export interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  update: (data: DragAndDropData) => void;
  submit: () => void;
  discard: () => void;
  acquire: (data: AcquireData) => void;
}

interface Transition extends DragDetail {
  startCoordinates: Coordinates;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private droppables = new Map<ItemId, Droppable>();
  private transition: null | Transition = null;

  /**
   * Inits a drag transition and issues a "start" event.
   *
   * The method overrides the previous transition if exists (w/o a cancellation event)!
   */
  public start(
    operation: Operation,
    interactionType: InteractionType,
    draggableItem: BoardItemDefinitionBase<unknown>,
    draggableElement: HTMLElement,
    startCoordinates: Coordinates
  ) {
    this.transition = {
      operation,
      interactionType,
      draggableItem,
      draggableElement,
      startCoordinates,
    };
    this.emit("start", this.getDragAndDropData(startCoordinates));
  }

  /**
   * Updates current transition with given coordinates and issues an "update" event.
   */
  public update(coordinates: Coordinates) {
    this.emit("update", this.getDragAndDropData(coordinates));
  }

  /**
   * Removes transition and issues a "submit" event.
   */
  public submit() {
    this.emit("submit");
    this.transition = null;
  }

  /**
   * Removes transition and issues a "discard" event.
   */
  public discard() {
    this.emit("discard");
    this.transition = null;
  }

  /**
   * Issues an "acquire" event to notify the current transition draggable is acquired by the given droppable.
   */
  public acquire(droppableId: ItemId) {
    if (!this.transition) {
      throw new Error("Invariant violation: no transition present for acquire.");
    }
    this.emit("acquire", { droppableId, draggableItem: this.transition.draggableItem });
  }

  /**
   * Registers a droppable used for collisions check, acquire, and dropTarget provision.
   */
  public addDroppable(id: ItemId, context: DropTargetContext, element: HTMLElement) {
    this.droppables.set(id, { element, context });
  }

  /**
   * Un-registers the droppable - use it when component unmounts.
   */
  public removeDroppable(id: ItemId) {
    this.droppables.delete(id);
  }

  /**
   * Retrieves all registered droppables to run a manual match against.
   */
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
  item: BoardItemDefinitionBase<unknown>;
  getElement: () => HTMLElement;
}) {
  return {
    start(operation: Operation, interactionType: InteractionType, startCoordinates: Coordinates) {
      controller.start(operation, interactionType, item, getElement(), startCoordinates);
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
    acquire(droppableId: ItemId) {
      controller.acquire(droppableId);
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
