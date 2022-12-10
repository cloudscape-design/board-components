// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import {
  CSSProperties,
  KeyboardEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  Ref,
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { TRANSITION_DURATION_MS } from "../constants";
import { DragAndDropData, Operation, useDragSubscription, useDraggable } from "../dnd-controller/controller";
import { useGridContext } from "../grid-context";
import { DashboardItemBase, Direction, ItemId, Transform } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { getMinItemSize } from "../utils/layout";
import { getNormalizedElementRect } from "../utils/screen";
import { useRefState } from "../utils/use-ref-state";
import { getNextDroppable } from "./get-next-droppable";
import styles from "./styles.css.js";

export interface ItemContainerRef {
  focusDragHandle(): void;
}

export interface ItemContext {
  dragHandle: {
    ref: React.RefObject<HTMLButtonElement>;
    onPointerDown(event: ReactPointerEvent): void;
    onKeyDown(event: KeyboardEvent): void;
  };
  resizeHandle: null | {
    onPointerDown(event: ReactPointerEvent): void;
    onKeyDown(event: KeyboardEvent): void;
  };
}

const Context = createContext<ItemContext | null>(null);

export function useItemContext() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("Unable to find DashboardItem context");
  }
  return ctx;
}

interface Transition {
  itemId: ItemId;
  operation: Operation;
  sizeTransform: null | { width: number; height: number };
  positionTransform: null | { x: number; y: number };
}

/**
 * Defines item's parameters and its relation with the layout.
 *
 * `item` - the unique dashboard item base object to be used in d&d context.
 * `acquired` - specifies if the item is essentially a copy temporarily acquired by a droppable but not submitted yet.
 * `itemSize` - the actual item's size in units.
 * `itemMaxSize` - the item's size in units it is allowed to grow to.
 * `transform` - items's position and size offset in units to temporarily change its placement.
 * `onNavigate` - a callback to fire when arrow keys are pressed on drag handle.
 */
interface ItemContainerProps {
  item: DashboardItemBase<unknown>;
  acquired?: boolean;
  itemSize: { width: number; height: number };
  itemMaxSize: { width: number; height: number };
  transform: null | Transform;
  onNavigate(direction: Direction): void;
  children: ReactNode;
}

export const ItemContainer = forwardRef(ItemContainerComponent);

function ItemContainerComponent(
  { item, acquired, itemSize, itemMaxSize, transform, onNavigate, children }: ItemContainerProps,
  ref: Ref<ItemContainerRef>
) {
  const pointerOffsetRef = useRef(new Coordinates({ x: 0, y: 0 }));
  const [getInteractionType, interactionTypeState, setInteractionType] = useRefState<"pointer" | "keyboard">("pointer");
  const [getIsBorrowed, isBorrowedState, setIsBorrowed] = useRefState(false);
  const [transition, setTransition] = useState<null | Transition>(null);
  const [dragActive, setDragActive] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const draggableApi = useDraggable({ item, getElement: () => itemRef.current! });
  const eventHandlersRef = useRef({
    onPointerMove: (event: PointerEvent) => draggableApi.updateTransition(Coordinates.fromEvent(event)),
    onPointerUp: () => draggableApi.submitTransition(),
  });
  const gridContext = useGridContext();

  function updateTransition({ operation, draggableItem, collisionRect, coordinates, dropTarget }: DragAndDropData) {
    setDragActive(true);

    if (item.id === draggableItem.id) {
      const [width, height] = [collisionRect.right - collisionRect.left, collisionRect.bottom - collisionRect.top];
      const pointerOffset = pointerOffsetRef.current;

      if (operation === "resize") {
        const { width: minWidth, height: minHeight } = dropTarget!.scale(getMinItemSize(draggableItem));
        const { width: maxWidth } = dropTarget!.scale(itemMaxSize);
        setTransition({
          operation,
          itemId: draggableItem.id,
          sizeTransform: {
            width: Math.max(minWidth, Math.min(maxWidth, width - pointerOffset.x)),
            height: Math.max(minHeight, height - pointerOffset.y),
          },
          positionTransform: null,
        });
      } else {
        setTransition({
          operation,
          itemId: draggableItem.id,
          sizeTransform: dropTarget ? dropTarget.scale(itemSize) : { width, height },
          positionTransform: { x: coordinates.x - pointerOffset.x, y: coordinates.y - pointerOffset.y },
        });
      }
    }
  }

  useDragSubscription("start", (detail) => {
    updateTransition(detail);

    if (getInteractionType() === "pointer" && item.id === detail.draggableItem.id) {
      window.addEventListener("pointermove", eventHandlersRef.current.onPointerMove);
      window.addEventListener("pointerup", eventHandlersRef.current.onPointerUp);
    }
  });

  useDragSubscription("update", (detail) => updateTransition(detail));

  useDragSubscription("submit", () => {
    setIsBorrowed(false);
    setDragActive(false);
    setTransition(null);
    window.removeEventListener("pointermove", eventHandlersRef.current.onPointerMove);
    window.removeEventListener("pointerup", eventHandlersRef.current.onPointerUp);
  });

  useDragSubscription("discard", () => {
    setIsBorrowed(false);
    setDragActive(false);
    setTransition(null);
    window.removeEventListener("pointermove", eventHandlersRef.current.onPointerMove);
    window.removeEventListener("pointerup", eventHandlersRef.current.onPointerUp);
  });

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

      setInteractionType("keyboard");

      if (operation === "drag" && !gridContext) {
        draggableApi.start("insert", coordinates);
      } else if (operation === "drag") {
        draggableApi.start("reorder", coordinates);
      } else {
        draggableApi.start("resize", coordinates);
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
      return;
    }

    // Notify the respective droppable of the intention to insert the item in it.
    nextDroppable.context.acquire();

    setIsBorrowed(true);
  }

  function onHandleKeyDown(operation: "drag" | "resize", event: KeyboardEvent) {
    const canInsert = transition && operation === "drag" && !gridContext;
    const canNavigate = transition || operation === "drag";

    // The insert is handled by the item and the navigation is delegated to the containing layout.
    const move = (direction: Direction) => {
      if (canInsert) {
        handleInsert(direction);
      } else if (canNavigate) {
        onNavigate(direction);
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
        return draggableApi.discardTransition();
    }
  }

  function onBlur() {
    // When drag- or resize handle loses focus the transition must be discarded with two exceptions:
    // 1. If the last interaction is not "keyboard" (the user clicked on another handle issuing a new transition);
    // 2. If the item is borrowed (in that case the focus moves to the acquired item which is expected).
    if (transition && getInteractionType() === "keyboard" && !getIsBorrowed()) {
      draggableApi.discardTransition();
    }
  }

  function onDragHandlePointerDown(event: ReactPointerEvent) {
    // Calculate the offset between item's top-left corner and the pointer landing position.
    const rect = itemRef.current!.getBoundingClientRect();
    pointerOffsetRef.current = new Coordinates({ x: event.clientX - rect.left, y: event.clientY - rect.top });

    setInteractionType("pointer");
    draggableApi.start(!gridContext ? "insert" : "reorder", Coordinates.fromEvent(event));
  }

  function onDragHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("drag", event);
  }

  function onResizeHandlePointerDown(event: ReactPointerEvent) {
    // Calculate the offset between item's bottom-right corner and the pointer landing position.
    const rect = itemRef.current!.getBoundingClientRect();
    pointerOffsetRef.current = new Coordinates({ x: event.clientX - rect.right, y: event.clientY - rect.bottom });

    setInteractionType("pointer");
    draggableApi.start("resize", Coordinates.fromEvent(event));
  }

  function onResizeHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("resize", event);
  }

  // TODO: use a combination of styles and classes.
  // When there is a transition the item's placement and styles might need to be altered for the period of the transition.
  let style: CSSProperties = {};

  if (transition && interactionTypeState === "pointer") {
    style = getPointerDragStyles(transition);
  } else if (isBorrowedState) {
    style = getBorrowedItemStyles();
  } else {
    style = getLayoutShiftStyles();
  }

  function getPointerDragStyles(transition: Transition): CSSProperties {
    return {
      zIndex: 5000,
      position: transition.operation === "resize" ? "absolute" : "fixed",
      left: transition.positionTransform?.x,
      top: transition.positionTransform?.y,
      width: transition.sizeTransform?.width,
      height: transition.sizeTransform?.height,
    };
  }

  function getBorrowedItemStyles(): CSSProperties {
    return { opacity: 0.5 };
  }

  function getLayoutShiftStyles(): CSSProperties {
    const transitionStyle = dragActive
      ? CSSUtil.Transition.toString({ property: "transform", duration: TRANSITION_DURATION_MS, easing: "ease" })
      : undefined;

    if (!transform || !gridContext) {
      return { transition: transitionStyle };
    }

    const shouldTransformSize = transform.width !== itemSize.width || transform.height !== itemSize.height;

    return {
      transform: CSSUtil.Transform.toString({
        x: gridContext.getColOffset(transform.x),
        y: gridContext.getRowOffset(transform.y),
        scaleX: 1,
        scaleY: 1,
      }),
      zIndex: transition && transition.itemId === item.id ? 1 : undefined,
      position: shouldTransformSize ? "absolute" : undefined,
      width: shouldTransformSize ? gridContext.getWidth(transform.width) : undefined,
      height: shouldTransformSize ? gridContext.getHeight(transform.height) : undefined,
      transition: transitionStyle,
    };
  }

  const dragHandleRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => ({
    focusDragHandle: () => dragHandleRef.current?.focus(),
  }));

  return (
    <div ref={itemRef} className={styles.root} style={style} data-item-id={item.id} onBlur={onBlur}>
      <Context.Provider
        value={{
          dragHandle: {
            ref: dragHandleRef,
            onPointerDown: onDragHandlePointerDown,
            onKeyDown: onDragHandleKeyDown,
          },
          resizeHandle: gridContext
            ? {
                onPointerDown: onResizeHandlePointerDown,
                onKeyDown: onResizeHandleKeyDown,
              }
            : null,
        }}
      >
        {children}
      </Context.Provider>
    </div>
  );
}
