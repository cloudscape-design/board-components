// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getLogicalBoundingClientRect, getLogicalClientX } from "@cloudscape-design/component-toolkit/internal";
import { InteractionState } from "@cloudscape-design/components/internal/components/drag-handle/hooks/interfaces";

import { Operation } from "../dnd-controller/controller"; // Adjust this path
import { Coordinates } from "../utils/coordinates"; // Adjust this path based on your project structure
import { CLICK_DRAG_THRESHOLD, Transition } from ".";

export type HandleActiveState = null | "pointer" | "uap";

export interface DetermineHandleActiveStateArgs {
  isHandleActive: boolean;
  currentTransition: Transition | null;
  interactionHookValue: InteractionState;
  targetOperation: Operation;
}

export function getDndOperationType(uiOperation: "drag" | "resize", isItemPlaced: boolean): Operation {
  if (uiOperation === "resize") {
    return "resize";
  }
  return isItemPlaced ? "reorder" : "insert";
}

interface CalculateInitialPointerDataArgs {
  event: PointerEvent;
  operation: "drag" | "resize";
  rect: ReturnType<typeof getLogicalBoundingClientRect>;
  getMinSize: () => { minWidth: number; minHeight: number };
  isRtl: boolean;
}

/**
 * Calculates the initial pointer offset and boundaries for a drag or resize interaction
 * to help determine how the item's movement or resizing behaves relative to the pointer.
 */
export function calculateInitialPointerData({
  event,
  operation,
  rect,
  getMinSize,
  isRtl,
}: CalculateInitialPointerDataArgs): {
  pointerOffset: Coordinates;
  pointerBoundaries: Coordinates | null;
} {
  const clientX = getLogicalClientX(event, isRtl);
  const clientY = event.clientY;

  let pointerOffset: Coordinates;
  let pointerBoundaries: Coordinates | null = null;

  if (operation === "resize") {
    // For resize, offset is calculated from the bottom-right corner.
    pointerOffset = new Coordinates({
      x: clientX - rect.insetInlineEnd,
      y: clientY - rect.insetBlockEnd,
    });

    // Boundaries to ensure resize doesn't go below minimum dimensions.
    const { minWidth, minHeight } = getMinSize();
    pointerBoundaries = new Coordinates({
      x: clientX - rect.inlineSize + minWidth,
      y: clientY - rect.blockSize + minHeight,
    });
  } else {
    // For drag, offset is calculated from the top-left corner.
    pointerOffset = new Coordinates({
      x: clientX - rect.insetInlineStart,
      y: clientY - rect.insetBlockStart,
    });
  }

  return { pointerOffset, pointerBoundaries };
}

export function hasPointerMovedBeyondThreshold(
  event: PointerEvent,
  initialPosition: { x: number; y: number } | undefined,
  threshold: number = CLICK_DRAG_THRESHOLD,
): boolean {
  if (!initialPosition) {
    return false;
  }
  return (
    event.clientX > initialPosition.x + threshold ||
    event.clientX < initialPosition.x - threshold ||
    event.clientY > initialPosition.y + threshold ||
    event.clientY < initialPosition.y - threshold
  );
}

export function determineHandleActiveState({
  isHandleActive,
  currentTransition,
  interactionHookValue,
  targetOperation,
}: DetermineHandleActiveStateArgs): HandleActiveState {
  if (isHandleActive && currentTransition?.operation === targetOperation && interactionHookValue === "dnd-start") {
    return "pointer";
  } else if (
    isHandleActive &&
    currentTransition?.operation === targetOperation &&
    interactionHookValue === "uap-action-start"
  ) {
    return "uap";
  }
  return null;
}
