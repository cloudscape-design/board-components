// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { Coordinates, DashboardItemBase, ItemId, ScaleProps } from "../interfaces";
import { isInsideRect } from "../utils/geometry";
import { getCoordinates } from "../utils/get-coordinates";
import { getHoveredDroppables } from "./collision";
import { EventEmitter } from "./event-emitter";

export interface DragAndDropData extends DragDetail {
  cursorOffset: Coordinates;
  collisionIds: ItemId[];
  dropTarget: null | { scale: ScaleProps };
}

interface LayoutData {
  element: HTMLElement;
  scale: ScaleProps;
}

interface DroppableData {
  element: HTMLElement;
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
  layout: () => void;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private layouts = new Map<string, LayoutData>();
  private droppables = new Map<ItemId, DroppableData>();
  private activeDragDetail: null | DragDetail = null;
  private startCoordinates: null | Coordinates = null;

  public activateDrag(dragDetail: DragDetail, coordinates: Coordinates) {
    this.activeDragDetail = { ...dragDetail };
    this.startCoordinates = { ...coordinates };
    this.emit("start", this.getDragAndDropData(coordinates));
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
  }

  public registerLayout(id: string, element: HTMLElement, scale: ScaleProps) {
    this.layouts.set(id, { element, scale });
    this.emit("layout");
  }

  public unregisterLayout(id: string) {
    this.layouts.delete(id);
    this.emit("layout");
  }

  public registerDroppable(id: string, element: HTMLElement) {
    this.droppables.set(id, { element });
  }

  public unregisterDroppable(id: string) {
    this.droppables.delete(id);
  }

  public matchLayout(element: HTMLElement) {
    const elementRect = element.getBoundingClientRect();

    for (const [layoutId, layoutData] of this.layouts) {
      if (isInsideRect(elementRect, layoutData.element.getBoundingClientRect())) {
        return { layoutId, scale: layoutData.scale };
      }
    }
    return null;
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
    if (collisionIds.length === 0) {
      return { collisionIds, dropTarget: null };
    }
    const matchedDroppable = droppableEntries.find(([id]) => id === collisionIds[0]);
    if (!matchedDroppable) {
      throw new Error("Invariant violation: no droppable matches collision.");
    }
    const matchedLayout = this.matchLayout(matchedDroppable[1].element);
    if (!matchedLayout) {
      throw new Error("Invariant violation: no layout matches droppable.");
    }
    return { collisionIds, dropTarget: { scale: matchedLayout.scale } };
  }
}

// Controller is a singleton and is shared between all d&d elements.
const controller = new DragAndDropController();

export function useDragSubscription<K extends keyof DragAndDropEvents>(event: K, handler: DragAndDropEvents[K]) {
  useEffect(() => controller.on(event, handler), [event, handler]);
}

export function useLayout({
  id,
  getElement,
  scaleProps,
}: {
  id: string;
  getElement: () => HTMLElement;
  scaleProps: ScaleProps;
}) {
  useEffect(() => {
    controller.registerLayout(id, getElement(), scaleProps);
    return () => controller.unregisterLayout(id);
  }, [id, scaleProps, getElement]);
}

export function useDraggable({
  item,
  getElement,
}: {
  item: DashboardItemBase<unknown>;
  getElement: () => HTMLElement;
}) {
  const [layout, setLayout] = useState<null | { layoutId: string; scale: ScaleProps }>(null);
  useEffect(() => {
    setLayout(controller.matchLayout(getElement()));
    return controller.on("layout", () => setLayout(controller.matchLayout(getElement())));
  }, [getElement]);

  return {
    layout,
    startMove(coordinates: Coordinates) {
      const operation = "move";
      const draggableElement = getElement();
      const draggableSize = draggableElement.getBoundingClientRect();
      controller.activateDrag({ operation, draggableItem: item, draggableElement, draggableSize }, coordinates);
    },
    startResize(coordinates: Coordinates) {
      const operation = "resize";
      const draggableElement = getElement();
      const draggableSize = draggableElement.getBoundingClientRect();
      controller.activateDrag({ operation, draggableItem: item, draggableElement, draggableSize }, coordinates);
    },
  };
}

export function useDroppable({ itemId, getElement }: { itemId: ItemId; getElement: () => HTMLElement }) {
  useEffect(() => {
    controller.registerDroppable(itemId, getElement());
    return () => controller.unregisterDroppable(itemId);
  }, [itemId, getElement]);
}
