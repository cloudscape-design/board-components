// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Ref, RefObject, useEffect, useRef } from "react";
import { Coordinates, DashboardItemBase } from "../interfaces";
import { EventEmitter } from "./event-emitter";

export interface DragAndDropData extends DragDetail {
  dashboards: readonly [string, DashboardData][];
  droppables: readonly [string, HTMLElement][];
  coordinates: Coordinates;
}

interface DashboardData {
  element: HTMLElement;
  columns: number;
}

interface DragDetail {
  item: DashboardItemBase<unknown>;
  containerRef: RefObject<HTMLElement>;
  resize: boolean;
}

interface DragAndDropEvents {
  start: (data: DragAndDropData) => void;
  move: (data: DragAndDropData) => void;
  drop: (data: DragAndDropData) => void;
}

class DragAndDropController extends EventEmitter<DragAndDropEvents> {
  private dashboards = new Map<string, DashboardData>();
  private droppables = new Map<string, HTMLElement>();
  private activeDragDetail: DragDetail | null = null;

  public activateDrag(dragDetail: DragDetail, coordinates: Coordinates) {
    console.log("ACTIVATE");
    this.activeDragDetail = dragDetail;
    this.emit("start", {
      ...this.activeDragDetail,
      coordinates,
      dashboards: [...this.dashboards.entries()],
      droppables: [...this.droppables.entries()],
    });
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
  }

  public addDashboard(element: HTMLElement, id: string, columns: number) {
    this.dashboards.set(id, { element, columns });
  }

  public removeDashboard(id: string) {
    this.droppables.delete(id);
  }

  public addDroppable(element: HTMLElement, id: string) {
    this.droppables.set(id, element);
  }

  public removeDroppable(id: string) {
    this.droppables.delete(id);
  }

  private onPointerMove = (coordinates: Coordinates) => {
    console.log("MOVE");
    if (!this.activeDragDetail) {
      throw new Error("Invariant violation: no active drag detail present for move.");
    }
    this.emit("move", {
      ...this.activeDragDetail,
      coordinates,
      dashboards: [...this.dashboards.entries()],
      droppables: [...this.droppables.entries()],
    });
  };

  private onPointerUp = (coordinates: Coordinates) => {
    console.log("STOP");
    if (!this.activeDragDetail) {
      throw new Error("Invariant violation: no active drag detail present for drop.");
    }
    this.emit("drop", {
      ...this.activeDragDetail,
      coordinates,
      dashboards: [...this.dashboards.entries()],
      droppables: [...this.droppables.entries()],
    });
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
    this.activeDragDetail = null;
  };
}

// Controller is a singleton and is shared between all d&d elements.
const controller = new DragAndDropController();

export function useDragSubscription<K extends keyof DragAndDropEvents>(event: K, handler: DragAndDropEvents[K]) {
  useEffect(() => controller.on(event, handler), [event, handler]);
}

export function useDraggable(dragDetail: DragDetail) {
  return {
    onStart(coordinates: Coordinates) {
      controller.activateDrag(dragDetail, coordinates);
    },
  };
}

export function useDashboard(id: string, columns: number) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      controller.addDashboard(ref.current, id, columns);
      return () => controller.removeDashboard(id);
    }
  }, [id, columns]);

  return ref as Ref<any>;
}

export function useDroppable(id: string) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      controller.addDroppable(ref.current, id);
      return () => controller.removeDroppable(id);
    }
  }, [id]);

  return ref as Ref<any>;
}
