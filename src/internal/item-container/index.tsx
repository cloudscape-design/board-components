// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import clsx from "clsx";
import {
  CSSProperties,
  KeyboardEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  Ref,
  RefObject,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  DragAndDropData,
  DropTargetContext,
  InteractionType,
  Operation,
  useDragSubscription,
  useDraggable,
} from "../dnd-controller/controller";
import { BoardItemDefinitionBase, Direction, ItemId, Transform } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { getIsRtl, getLogicalBoundingClientRect, getLogicalClientX, getNormalizedElementRect } from "../utils/screen";
import { throttle } from "../utils/throttle";
import { getCollisionRect } from "./get-collision-rect";
import { getNextDroppable } from "./get-next-droppable";
import styles from "./styles.css.js";

export interface ItemContainerRef {
  focusDragHandle(): void;
}

interface ItemContextType {
  isActive: boolean;
  dragHandle: {
    ref: RefObject<HTMLButtonElement>;
    onPointerDown(event: ReactPointerEvent): void;
    onKeyDown(event: KeyboardEvent): void;
    isActive: boolean;
  };
  resizeHandle: null | {
    onPointerDown(event: ReactPointerEvent): void;
    onKeyDown(event: KeyboardEvent): void;
    isActive: boolean;
  };
}

export const ItemContext = createContext<ItemContextType | null>(null);

export function useItemContext() {
  const ctx = useContext(ItemContext);
  if (!ctx) {
    throw new Error("Unable to find BoardItem context.");
  }
  return ctx;
}

interface Transition {
  itemId: ItemId;
  operation: Operation;
  interactionType: InteractionType;
  sizeTransform: null | { width: number; height: number };
  positionTransform: null | { x: number; y: number };
  hasDropTarget?: boolean;
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
}

export const ItemContainer = forwardRef(ItemContainerComponent);

function ItemContainerComponent(
  { item, placed, acquired, inTransition, transform, getItemSize, onKeyMove, children }: ItemContainerProps,
  ref: Ref<ItemContainerRef>,
) {
  const originalSizeRef = useRef({ width: 0, height: 0 });
  const pointerOffsetRef = useRef(new Coordinates({ x: 0, y: 0 }));
  const pointerBoundariesRef = useRef<null | Coordinates>(null);
  const [transition, setTransition] = useState<null | Transition>(null);
  const [isHidden, setIsHidden] = useState(false);
  const muteEventsRef = useRef(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const isRtl = itemRef.current ? getIsRtl(itemRef.current) : false;
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

  // During the transition listen to pointer move and pointer up events to update/submit transition.
  const transitionInteractionType = transition?.interactionType ?? null;
  const transitionItemId = transition?.itemId ?? null;
  useEffect(() => {
    const onPointerMove = throttle((event: PointerEvent) => {
      const coordinates = Coordinates.fromEvent(event);
      draggableApi.updateTransition(
        new Coordinates({
          x: Math.max(coordinates.x, pointerBoundariesRef.current?.x ?? Number.NEGATIVE_INFINITY),
          y: Math.max(coordinates.y, pointerBoundariesRef.current?.y ?? Number.NEGATIVE_INFINITY),
        }),
      );
    }, 10);
    const onPointerUp = () => {
      onPointerMove.cancel();
      draggableApi.submitTransition();
    };

    if (transitionInteractionType === "pointer" && transitionItemId === item.id) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    // draggableApi is not expected to change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, transitionInteractionType, transitionItemId]);

  useEffect(() => {
    if (transitionInteractionType === "keyboard" && transitionItemId === item.id) {
      const onPointerDown = () => draggableApi.submitTransition();
      window.addEventListener("pointerdown", onPointerDown, true);
      return () => {
        window.removeEventListener("pointerdown", onPointerDown, true);
      };
    }
    // draggableApi is not expected to change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, transitionInteractionType, transitionItemId]);

  function onKeyboardTransitionToggle(operation: "drag" | "resize") {
    // The acquired item is a copy and does not have the transition state.
    // However, pressing "Space" or "Enter" on the acquired item must submit the active transition.
    if (acquired) {
      return draggableApi.submitTransition();
    }

    // Create new transition if missing.
    if (!transition) {
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
    // Submit a transition if existing.
    else {
      draggableApi.submitTransition();
    }
  }

  function handleInsert(direction: Direction) {
    // Find the closest droppable (in the direction) to the item.
    const droppables = draggableApi.getDroppables();
    const nextDroppable = getNextDroppable(itemRef.current!, droppables, direction);

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

  function onHandleKeyDown(operation: "drag" | "resize", event: KeyboardEvent) {
    const canInsert = transition && operation === "drag" && !placed;
    const canNavigate = transition || operation === "drag";

    // The insert is handled by the item and the navigation is delegated to the containing layout.
    const move = (direction: Direction) => {
      if (canInsert) {
        handleInsert(direction);
      } else if (canNavigate) {
        onKeyMove?.(direction);
      }
    };

    const discard = () => {
      if (transition || acquired) {
        draggableApi.discardTransition();
      }
    };

    switch (event.key) {
      case "ArrowUp":
        return move("up");
      case "ArrowDown":
        return move("down");
      case "ArrowLeft":
        return move("left");
      case "ArrowRight":
        return move("right");
      case " ":
      case "Enter":
        return onKeyboardTransitionToggle(operation);
      case "Escape":
        return discard();
    }
  }

  function onBlur() {
    // When drag- or resize handle on palette or board item loses focus the transition must be submitted with two exceptions:
    // 1. If the last interaction is not "keyboard" (the user clicked on another handle issuing a new transition);
    // 2. If the item is acquired by the board (in that case the focus moves to the board item which is expected, palette item is hidden and all events handlers must be muted).
    if (transition && transition.interactionType === "keyboard" && !muteEventsRef.current) {
      draggableApi.submitTransition();
    }
  }

  function onDragHandlePointerDown(event: ReactPointerEvent) {
    // Calculate the offset between item's top-left corner and the pointer landing position.
    const rect = getLogicalBoundingClientRect(itemRef.current!);
    const clientX = getLogicalClientX(event, isRtl);
    const clientY = event.clientY;
    pointerOffsetRef.current = new Coordinates({
      x: clientX - rect.insetInlineStart,
      y: clientY - rect.insetBlockStart,
    });
    originalSizeRef.current = { width: rect.inlineSize, height: rect.blockSize };
    pointerBoundariesRef.current = null;

    draggableApi.start(!placed ? "insert" : "reorder", "pointer", Coordinates.fromEvent(event));
  }

  function onDragHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("drag", event);
  }

  function onResizeHandlePointerDown(event: ReactPointerEvent) {
    // Calculate the offset between item's bottom-right corner and the pointer landing position.
    const rect = getLogicalBoundingClientRect(itemRef.current!);
    const clientX = getLogicalClientX(event, isRtl);
    const clientY = event.clientY;
    pointerOffsetRef.current = new Coordinates({ x: clientX - rect.insetInlineEnd, y: clientY - rect.insetBlockEnd });
    originalSizeRef.current = { width: rect.inlineSize, height: rect.blockSize };

    // Calculate boundaries below which the cursor cannot move.
    const minWidth = getItemSize(null).minWidth;
    const minHeight = getItemSize(null).minHeight;
    pointerBoundariesRef.current = new Coordinates({
      x: clientX - rect.inlineSize + minWidth,
      y: clientY - rect.blockSize + minHeight,
    });

    draggableApi.start("resize", "pointer", Coordinates.fromEvent(event));
  }

  function onResizeHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("resize", event);
  }

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

  const dragHandleRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => ({
    focusDragHandle: () => dragHandleRef.current?.focus(),
  }));

  const isActive = (!!transition && !isHidden) || !!acquired;
  const shouldUsePortal = transition?.operation === "insert" && transition?.interactionType === "pointer";
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
          dragHandle: {
            ref: dragHandleRef,
            onPointerDown: onDragHandlePointerDown,
            onKeyDown: onDragHandleKeyDown,
            isActive: isActive && transition?.operation === "reorder",
          },
          resizeHandle: placed
            ? {
                onPointerDown: onResizeHandlePointerDown,
                onKeyDown: onResizeHandleKeyDown,
                isActive: isActive && transition?.operation === "resize",
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
