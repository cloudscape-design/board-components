// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  createContext,
  CSSProperties,
  forwardRef,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  Ref,
  RefObject,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import clsx from "clsx";

import { createSingletonHandler, getLogicalBoundingClientRect } from "@cloudscape-design/component-toolkit/internal";
import {
  useInternalDragHandleInteractionState,
  UseInternalDragHandleInteractionStateProps,
} from "@cloudscape-design/components/internal/do-not-use/drag-handle";

import {
  DragAndDropData,
  DropTargetContext,
  InteractionType,
  Operation,
  useDraggable,
  useDragSubscription,
} from "../dnd-controller/controller";
import { BoardItemDefinitionBase, Direction, ItemId, Transform } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { getNormalizedElementRect } from "../utils/screen";
import { throttle } from "../utils/throttle";
import { getCollisionRect } from "./get-collision-rect";
import { getNextDroppable } from "./get-next-droppable";
import {
  calculateInitialPointerData,
  determineHandleActiveState,
  getDndOperationType,
  hasPointerMovedBeyondThreshold,
} from "./utils";

import styles from "./styles.css.js";

export interface ItemContainerRef {
  focusDragHandle(): void;
}

export type HandleActiveState = null | "pointer" | "uap";

interface ItemContextType {
  /**
   * Flag indicating if a drag or resize interaction is currently active.
   */
  isActive: boolean;
  /**
   * Flag indicating if the item is currently hidden.
   * (When a board item is moved from the palette to the board and the transition is not submitted)
   */
  isHidden: boolean;
  dragHandle: {
    /**
     * Ref to the drag button. Used to focus the drag handle when moving an item
     * from the palette to the board via keyboard or UAP actions.
     */
    ref: RefObject<HTMLDivElement>;
    /**
     * Listen to pointerDown events on the drag handle.
     * Used to start a transition and attach global event handlers.
     */
    onPointerDown(event: ReactPointerEvent): void;
    /**
     * Listen to keyDown events on the drag handle.
     */
    onKeyDown(event: KeyboardEvent): void;
    /**
     * Indicating if drag handle is active.
     */
    activeState: HandleActiveState;
    /**
     * Listen to UAP direction button clicks.
     */
    onDirectionClick(direction: KeyboardEvent["key"], operation: HandleOperation): void;
    /**
     * Flag indicating if the UAP buttons should be shown. E.g. when a item is moved from
     * the palette via keyboard or UAP to the board.
     */
    initialShowButtons?: boolean;
  };
  resizeHandle: null | {
    /**
     * Listen to pointerDown events on the drag handle.
     * Used to start a transition and attach global event handlers.
     */
    onPointerDown(event: ReactPointerEvent): void;
    /**
     * Listen to keyDown events on the drag handle.
     */
    onKeyDown(event: KeyboardEvent): void;
    /**
     * Indicating if resize handle is active.
     */
    activeState: HandleActiveState;
    /**
     * Listen to UAP direction button clicks.
     */
    onDirectionClick(direction: KeyboardEvent["key"], operation: HandleOperation): void;
  };
}

export interface Transition {
  itemId: ItemId;
  operation: Operation;
  interactionType: InteractionType;
  sizeTransform: null | { width: number; height: number };
  positionTransform: null | { x: number; y: number };
  hasDropTarget?: boolean;
}

export type HandleOperation = "drag" | "resize";

export const ItemContext = createContext<ItemContextType | null>(null);

export function useItemContext() {
  const ctx = useContext(ItemContext);
  if (!ctx) {
    throw new Error("Unable to find BoardItem context.");
  }
  return ctx;
}

/**
 * Defines item's parameters and its relation with the layout.
 *
 * `item` - the unique board item base object to be used in d&d context.
 * `placed` - specifies if the item already belongs to the board.
 * `acquired` - specifies if the item is essentially a copy temporarily acquired by a droppable but not submitted yet.
 * `inTransition` - specifies if the item is currently being moved.
 * `transform` - specifies if the item's position needs to be altered.
 * `getItemSize` - item size getter that takes droppable context as argument.
 * `onKeyMove` - a callback that fires when arrow keys are pressed in drag- or resize handle.
 */
export interface ItemContainerProps {
  item: BoardItemDefinitionBase<unknown>;
  placed: boolean;
  acquired: boolean;
  inTransition: boolean;
  transform: Transform | undefined;
  getItemSize: (context: null | DropTargetContext) => {
    width: number;
    minWidth: number;
    maxWidth: number;
    height: number;
    minHeight: number;
    maxHeight: number;
  };

  onKeyMove?(direction: Direction): void;

  children: (hasDropTarget: boolean) => ReactNode;
  isRtl: () => boolean;
}

export const ItemContainer = forwardRef(ItemContainerComponent);

// The amount of distance after pointer down that the cursor is allowed to
// jitter for a subsequent mouseup to still register as a "press" instead of
// a drag. A little allowance is needed for usability reasons, but this number
// isn't set in stone.
export const CLICK_DRAG_THRESHOLD = 3;

// We use singleton helper to avoid creating event listeners per each board item.
const usePointerEventListeners = createSingletonHandler<
  { type: "move"; event: PointerEvent } | { type: "up"; event: PointerEvent }
>((setEvent) => {
  const handleGlobalPointerMove = (event: PointerEvent) => setEvent({ type: "move", event });
  const handleGlobalPointerUp = (event: PointerEvent) => setEvent({ type: "up", event });
  const controller = new AbortController();
  window.addEventListener("pointermove", handleGlobalPointerMove, { signal: controller.signal });
  window.addEventListener("pointerup", handleGlobalPointerUp, { signal: controller.signal });
  return () => controller.abort();
});

function ItemContainerComponent(
  { item, placed, acquired, inTransition, transform, getItemSize, onKeyMove, children, isRtl }: ItemContainerProps,
  ref: Ref<ItemContainerRef>,
) {
  const originalSizeRef = useRef({ width: 0, height: 0 });
  const pointerOffsetRef = useRef(new Coordinates({ x: 0, y: 0 }));
  const pointerBoundariesRef = useRef<null | Coordinates>(null);
  const [transition, setTransition] = useState<null | Transition>(null);
  const [isHidden, setIsHidden] = useState(false);
  const muteEventsRef = useRef(false);
  const itemRef = useRef<HTMLDivElement>(null);
  // Keeps the starting position of active pointer-based d&d transition.
  // If undefined - it means the pointer-based d&d is not engaged.
  const initialPointerDownPosition = useRef<{ x: number; y: number } | undefined>();
  const draggableApi = useDraggable({
    draggableItem: item,
    getCollisionRect: (operation, coordinates, dropTarget) => {
      const sizeOverride = operation === "insert" && dropTarget ? getItemSize(dropTarget) : null;
      return getCollisionRect(operation, itemRef.current!, coordinates, sizeOverride);
    },
  });

  function updateTransition({
    operation,
    interactionType,
    draggableItem,
    collisionRect,
    coordinates,
    dropTarget,
  }: DragAndDropData) {
    if (item.id === draggableItem.id) {
      const [width, height] = [collisionRect.right - collisionRect.left, collisionRect.bottom - collisionRect.top];
      const pointerOffset = pointerOffsetRef.current;

      if (operation === "resize") {
        setTransition({
          operation,
          interactionType,
          itemId: draggableItem.id,
          sizeTransform: {
            width: Math.max(getItemSize(null).minWidth, Math.min(getItemSize(null).maxWidth, width - pointerOffset.x)),
            height: Math.max(getItemSize(null).minHeight, height - pointerOffset.y),
          },
          positionTransform: null,
        });
      } else if (operation === "insert" || operation === "reorder") {
        setTransition({
          operation,
          interactionType,
          itemId: draggableItem.id,
          sizeTransform: dropTarget ? getItemSize(dropTarget) : originalSizeRef.current,
          positionTransform: { x: coordinates.x - pointerOffset.x, y: coordinates.y - pointerOffset.y },
          hasDropTarget: !!dropTarget,
        });
      }
    }
  }

  useDragSubscription("start", (detail) => updateTransition(detail));
  useDragSubscription("update", (detail) => updateTransition(detail));
  useDragSubscription("submit", () => {
    setTransition(null);
    setIsHidden(false);
    muteEventsRef.current = false;
  });
  useDragSubscription("discard", () => {
    setTransition(null);
    setIsHidden(false);
    muteEventsRef.current = false;
  });

  // Handles incremental transition logic shared between different keyboard and UAP interactions.
  function handleIncrementalTransition(operation: HandleOperation, submitExisting = false) {
    // The acquired item is a copy and does not have the transition state.
    // However, pressing "Space" or "Enter" on the acquired item must submit the active transition.
    if (acquired) {
      return draggableApi.submitTransition();
    }

    // Submit existing transition if requested and one exists
    if (submitExisting && transition) {
      return draggableApi.submitTransition();
    }

    const rect = getNormalizedElementRect(itemRef.current!);
    const coordinates = new Coordinates({
      x: operation === "drag" ? rect.left : rect.right,
      y: operation === "drag" ? rect.top : rect.bottom,
    });

    if (operation === "drag" && !placed) {
      draggableApi.start("insert", "keyboard", coordinates);
    } else if (operation === "drag") {
      draggableApi.start("reorder", "keyboard", coordinates);
    } else {
      draggableApi.start("resize", "keyboard", coordinates);
    }
  }

  function handleInsert(direction: Direction) {
    // Find the closest droppable (in the direction) to the item.
    const droppables = draggableApi.getDroppables();
    const nextDroppable = getNextDroppable({
      draggableElement: itemRef.current!,
      droppables,
      direction,
      isRtl: isRtl(),
    });

    if (!nextDroppable) {
      // TODO: add announcement
      // Context: the keyboard insertion only works when there is some droppable area in the specified direction.
      // That means that only some arrow keys might work which is confusing for a screen-reader user.
      // Alternatively, we can consider a multi-step insertion where the user would first explicitly select the desired board.
      return;
    }

    // Notify the respective droppable of the intention to insert the item in it.
    draggableApi.acquire(nextDroppable, () => children(true));
    setIsHidden(true);
    muteEventsRef.current = true;
  }

  function handleDirectionalMovement(direction: Direction, operation: HandleOperation) {
    const canInsert = transition && operation === "drag" && !placed;
    const canNavigate = transition || operation === "drag";
    if (canInsert) {
      handleInsert(direction);
    } else if (canNavigate) {
      onKeyMove?.(direction);
    }
  }

  function onHandleKeyDown(operation: HandleOperation, event: KeyboardEvent) {
    // We do not expect keyboard input when pointer-based d&d is performed.
    // Upon receiving any, we discard the current transition immediately.
    if (transition && initialPointerDownPosition.current) {
      initialPointerDownPosition.current = undefined;
      draggableApi.discardTransition();
      return;
    }

    const discard = () => {
      if (transition || acquired) {
        draggableApi.discardTransition();
      }
    };
    switch (event.key) {
      case "ArrowUp":
        return handleDirectionalMovement("up", operation);
      case "ArrowDown":
        return handleDirectionalMovement("down", operation);
      case "ArrowLeft":
        return handleDirectionalMovement("left", operation);
      case "ArrowRight":
        return handleDirectionalMovement("right", operation);
      case " ":
      case "Enter":
        return handleIncrementalTransition(operation, true);
      case "Escape":
        return discard();
    }
  }

  function onBlur() {
    // When drag- or resize handle on palette or board item loses focus the transition must be submitted with two exceptions:
    // 1. If the last interaction is not "keyboard" (the user clicked on another handle issuing a new transition);
    // 2. If the item is acquired by the board (in that case the focus moves to the board item which is expected, palette item is hidden and all events handlers must be muted).
    selectedHook.current.processBlur();
    initialPointerDownPosition.current = undefined;
    if (acquired || (transition && transition.interactionType === "keyboard" && !muteEventsRef.current)) {
      draggableApi.submitTransition();
    }
  }

  // Pointer-down handler, added to each drag- and resize handle.
  function onHandlePointerDown(event: ReactPointerEvent, operation: HandleOperation) {
    // Prevent UI issues when right-clicking: in such a case the OS context menu will be shown and
    // the board while the board-item is active. Because of the context menu under the pointer,
    // onPointerUp is not called anymore. In such a case the board item would stuck in onPointerUp.
    if (event.button !== 0) {
      return;
    }
    initialPointerDownPosition.current = { x: event.clientX, y: event.clientY };

    if (operation === "drag") {
      selectedHook.current = dragInteractionHook;
    } else {
      selectedHook.current = resizeInteractionHook;
    }
    selectedHook.current.processPointerDown(event.nativeEvent);
  }
  // Global pointer-move and pointer-up handlers.
  usePointerEventListeners(({ type, event }) => {
    switch (type) {
      case "move": {
        if (hasPointerMovedBeyondThreshold(event, initialPointerDownPosition.current)) {
          selectedHook.current.processPointerMove(event);
        }
        break;
      }
      case "up": {
        if (initialPointerDownPosition.current) {
          selectedHook.current.processPointerUp(event);
        }
        initialPointerDownPosition.current = undefined;
        break;
      }
    }
  });

  function handlePointerInteractionStart(event: PointerEvent, operation: "drag" | "resize") {
    const currentItemElement = itemRef.current;
    if (!currentItemElement) {
      console.warn("ItemContainer: itemRef.current is not available on interaction start.");
      return;
    }

    const rect = getLogicalBoundingClientRect(currentItemElement);
    originalSizeRef.current = { width: rect.inlineSize, height: rect.blockSize };

    const { pointerOffset, pointerBoundaries } = calculateInitialPointerData({
      event,
      operation,
      rect,
      getMinSize: () => getItemSize(null),
      isRtl: isRtl(),
    });
    pointerOffsetRef.current = pointerOffset;
    pointerBoundariesRef.current = pointerBoundaries;

    const dndOperation = getDndOperationType(operation, placed);
    const startCoordinates = Coordinates.fromEvent(event, { isRtl: isRtl() });
    draggableApi.start(dndOperation, "pointer", startCoordinates);
  }

  const onHandleDndTransitionActive = throttle((event: PointerEvent) => {
    const coordinates = Coordinates.fromEvent(event, { isRtl: isRtl() });
    draggableApi.updateTransition(
      new Coordinates({
        x: Math.max(coordinates.x, pointerBoundariesRef.current?.x ?? Number.NEGATIVE_INFINITY),
        y: Math.max(coordinates.y, pointerBoundariesRef.current?.y ?? Number.NEGATIVE_INFINITY),
      }),
    );
  }, 10) as (event: PointerEvent) => void;

  const itemTransitionStyle: CSSProperties = {};
  const itemTransitionClassNames: string[] = [];

  if (inTransition) {
    itemTransitionClassNames.push(styles.inTransition);
  }

  if (transition && transition.interactionType === "pointer") {
    // Adjust the dragged/resized item to the pointer's location.
    itemTransitionClassNames.push(transition.operation === "resize" ? styles.resized : styles.dragged);
    itemTransitionStyle.insetInlineStart = transition.positionTransform?.x;
    itemTransitionStyle.insetBlockStart = transition.positionTransform?.y;
    itemTransitionStyle.inlineSize = transition.sizeTransform?.width;
    itemTransitionStyle.blockSize = transition.sizeTransform?.height;
    itemTransitionStyle.pointerEvents = "none";
  }

  if (isHidden) {
    itemTransitionClassNames.push(styles.hidden);
  }

  if (transform) {
    // The moved items positions are altered with CSS transform.
    if (transform.type === "move") {
      itemTransitionClassNames.push(styles.transformed);
      itemTransitionStyle.transform = CSSUtil.Transform.toString({
        x: transform.x,
        y: transform.y,
        scaleX: 1,
        scaleY: 1,
      });
      itemTransitionStyle.width = transform.width + "px";
      itemTransitionStyle.height = transform.height + "px";
    }
    // The item is removed from the DOM after animations play.
    // During the animations the removed item is hidden with styles.
    if (transform.type === "remove") {
      itemTransitionClassNames.push(styles.removed);
    }
  }

  const dragHandleRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    focusDragHandle: () => {
      return dragHandleRef.current?.focus();
    },
  }));

  const dragHookProps: UseInternalDragHandleInteractionStateProps = {
    onDndStartAction: (event) => handlePointerInteractionStart(event, "drag"),
    onDndActiveAction: onHandleDndTransitionActive,
    onDndEndAction: () => transition && draggableApi.submitTransition(),
    onUapActionStartAction: () => handleIncrementalTransition("drag"),
  };
  const resizeHookProps: UseInternalDragHandleInteractionStateProps = {
    onDndStartAction: (event) => handlePointerInteractionStart(event, "resize"),
    onDndActiveAction: onHandleDndTransitionActive,
    onDndEndAction: () => transition && draggableApi.submitTransition(),
    onUapActionStartAction: () => handleIncrementalTransition("resize"),
  };

  // When d&d is active, either drag- or resize hook should be used.
  // We determine the correct one in the onHandlePointerDown handler, and store it to the selectedHook ref.
  const dragInteractionHook = useInternalDragHandleInteractionState(dragHookProps);
  const resizeInteractionHook = useInternalDragHandleInteractionState(resizeHookProps);
  const selectedHook = useRef(dragInteractionHook);

  const isActive = (!!transition && !isHidden) || !!acquired;
  const shouldUsePortal =
    transition?.operation === "insert" &&
    transition?.interactionType === "pointer" &&
    selectedHook.current.interaction.value === "dnd-active";
  const childrenRef = useRef<ReactNode>(null);
  if (!inTransition || isActive) {
    childrenRef.current = children(!!transition?.hasDropTarget);
  }

  const content = (
    <div
      ref={itemRef}
      className={clsx(styles.root, ...itemTransitionClassNames)}
      style={itemTransitionStyle}
      data-item-id={item.id}
      onBlur={onBlur}
    >
      <ItemContext.Provider
        value={{
          isActive,
          isHidden,
          dragHandle: {
            ref: dragHandleRef,
            onPointerDown: (e) => onHandlePointerDown(e, "drag"),
            onKeyDown: (event: KeyboardEvent) => onHandleKeyDown("drag", event),
            activeState: determineHandleActiveState({
              isHandleActive: isActive,
              currentTransition: transition,
              interactionHookValue: dragInteractionHook.interaction.value,
              targetOperation: "reorder",
            }),
            onDirectionClick: handleDirectionalMovement,
            initialShowButtons:
              dragInteractionHook.interaction.value === "uap-action-start" || (inTransition && acquired),
          },
          resizeHandle: placed
            ? {
                onPointerDown: (e) => onHandlePointerDown(e, "resize"),
                onKeyDown: (event: KeyboardEvent) => onHandleKeyDown("resize", event),
                activeState: determineHandleActiveState({
                  isHandleActive: isActive,
                  currentTransition: transition,
                  interactionHookValue: resizeInteractionHook.interaction.value,
                  targetOperation: "resize",
                }),
                onDirectionClick: handleDirectionalMovement,
              }
            : null,
        }}
      >
        {childrenRef.current}
      </ItemContext.Provider>
    </div>
  );

  return shouldUsePortal ? <div>{createPortal(content, document.body)}</div> : content;
}
