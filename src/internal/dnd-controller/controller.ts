// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode, useEffect } from "react";
import { BoardItemDefinitionBase, ItemId, Rect } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { EventEmitter } from "./event-emitter";
import { getHoveredDroppables } from "./get-hovered-droppables";

type Item = BoardItemDefinitionBase<unknown>;

export type Operation = "reorder" | "resize" | "insert";

export type InteractionType = "pointer" | "keyboard";

/**
 * Represents the relations between droppables and draggables.
 *
 * The `scale` function transforms draggable's width/height in relative units
 * to the absolute width/height in pixels the droppable expects.
 */
export interface DropTargetContext {
  scale: (item: Item, size?: { width: number; height: number }) => { width: number; height: number };
}

export interface DragAndDropData {
  operation: Operation;
  interactionType: InteractionType;
  draggableItem: Item;
  collisionRect: Rect;
  positionOffset: Coordinates;
  coordinates: Coordinates;
  collisionIds: ItemId[];
  dropTarget: null | DropTargetContext;
}

export interface Droppable {
  element: HTMLElement;
  context: DropTargetContext;
  sourceId: string;
}

interface AcquireData {
  droppableId: ItemId;
  draggableItem: Item;
  acquiredItemElement?: ReactNode;
}

export interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  update: (data: DragAndDropData) => void;
  submit: () => void;
  discard: () => void;
  acquire: (data: AcquireData) => void;
}

interface Transition {
  operation: Operation;
  interactionType: InteractionType;
  draggableItem: Item;
  getCollisionRect: (operation: Operation, coordinates: Coordinates, dropTarget: null | DropTargetContext) => Rect;
  startCoordinates: Coordinates;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private droppables = new Map<ItemId, Droppable>();
  private transition: null | Transition = null;
  private sourceId = "";

  /**
   * Inits a drag transition and issues a "start" event.
   *
   * The method overrides the previous transition if exists (w/o a cancellation event)!
   */
  public start(transition: Transition, sourceId: string) {
    this.transition = { ...transition };
    this.sourceId = sourceId;
    this.emit("start", this.getDragAndDropData(transition.startCoordinates));
  }

  /**
   * Updates current transition with given coordinates and issues an "update" event.
   */
  public update(coordinates: Coordinates, sourceId: string) {
    if (sourceId !== this.sourceId) {
      return;
    }
    this.emit("update", this.getDragAndDropData(coordinates));
  }

  /**
   * Removes transition and issues a "submit" event.
   */
  public submit(sourceId: string) {
    if (sourceId !== this.sourceId) {
      return;
    }
    this.emit("submit");
    this.transition = null;
  }

  /**
   * Removes transition and issues a "discard" event.
   */
  public discard(sourceId: string) {
    if (sourceId !== this.sourceId) {
      return;
    }
    this.emit("discard");
    this.transition = null;
  }

  /**
   * Issues an "acquire" event to notify the current transition draggable is acquired by the given droppable.
   */
  public acquire(droppableId: ItemId, acquiredItemElement?: ReactNode) {
    if (!this.transition) {
      throw new Error("Invariant violation: no transition present for acquire.");
    }
    const newSourceId = this.droppables.get(droppableId)?.sourceId;
    if (newSourceId) {
      this.sourceId = newSourceId;
    }
    this.emit("acquire", { droppableId, draggableItem: this.transition.draggableItem, acquiredItemElement });
  }

  /**
   * Registers a droppable used for collisions check, acquire, and dropTarget provision.
   */
  public addDroppable(id: ItemId, context: DropTargetContext, element: HTMLElement, sourceId: string) {
    this.droppables.set(id, { element, context, sourceId });
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
    const positionOffset = Coordinates.cursorOffset(coordinates, this.transition.startCoordinates);
    const collisionRect = this.getCollisionRect(this.transition, coordinates);
    const { collisionIds, dropTarget } = this.getCollisions(collisionRect);
    return { ...this.transition, positionOffset, coordinates, collisionRect, collisionIds, dropTarget };
  }

  private getCollisionRect(transition: Transition, coordinates: Coordinates) {
    const originalCollisionRect = transition.getCollisionRect(transition.operation, coordinates, null);
    const { dropTarget } = this.getCollisions(originalCollisionRect);
    return transition.getCollisionRect(transition.operation, coordinates, dropTarget);
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
  draggableItem,
  getCollisionRect,
}: {
  draggableItem: Item;
  getCollisionRect: (operation: Operation, coordinates: Coordinates, dropTarget: null | DropTargetContext) => Rect;
}) {
  return {
    start(operation: Operation, interactionType: InteractionType, startCoordinates: Coordinates, sourceId: string) {
      controller.start({ operation, interactionType, draggableItem, getCollisionRect, startCoordinates }, sourceId);
    },
    updateTransition(coordinates: Coordinates, sourceId: string) {
      controller.update(coordinates, sourceId);
    },
    submitTransition(sourceId: string) {
      controller.submit(sourceId);
    },
    discardTransition(sourceId: string) {
      controller.discard(sourceId);
    },
    acquire(droppableId: ItemId, acquiredItemElement?: ReactNode) {
      controller.acquire(droppableId, acquiredItemElement);
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
  sourceId,
}: {
  itemId: ItemId;
  context: DropTargetContext;
  getElement: () => HTMLElement;
  sourceId: string;
}) {
  useEffect(() => {
    controller.addDroppable(itemId, context, getElement(), sourceId);
    return () => controller.removeDroppable(itemId);
  }, [itemId, context, getElement, sourceId]);
}
