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
import {
  DragAndDropData,
  InteractionType,
  Operation,
  useDragSubscription,
  useDraggable,
} from "../dnd-controller/controller";
import { useGridContext } from "../grid-context";
import { BoardItemDefinitionBase, Direction, ItemId, Transform } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { getNormalizedElementRect } from "../utils/screen";
import { useStableEventHandler } from "../utils/use-stable-event-handler";
import { useThrottledEventHandler } from "../utils/use-throttled-event-handler";
import { getNextDroppable } from "./get-next-droppable";
import styles from "./styles.css.js";

export interface ItemContainerRef {
  focusDragHandle(): void;
}

export interface ItemContext {
  isActive: boolean;
  dragHandle: {
    ref: RefObject<HTMLButtonElement>;
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
  isBorrowed: boolean;
}

/**
 * Defines item's parameters and its relation with the layout.
 *
 * `item` - the unique board item base object to be used in d&d context.
 * `acquired` - specifies if the item is essentially a copy temporarily acquired by a droppable but not submitted yet.
 * `itemSize` - the actual item's size in units.
 * `itemMaxSize` - the item's size in units it is allowed to grow to (to constrain resize).
 * `onKeyMove` - a callback that fires when arrow keys are pressed in drag- or resize handle.
 */
export interface ItemContainerProps {
  item: BoardItemDefinitionBase<unknown>;
  acquired: boolean;
  inTransition: boolean;
  transform: Transform | undefined;
  itemSize: { width: number; height: number };
  itemMaxSize: { width: number; height: number };
  onKeyMove?(direction: Direction): void;
  children: ReactNode;
}

export const ItemContainer = forwardRef(ItemContainerComponent);

function ItemContainerComponent(
  { item, acquired, inTransition, transform, itemSize, itemMaxSize, onKeyMove, children }: ItemContainerProps,
  ref: Ref<ItemContainerRef>
) {
  const originalSizeRef = useRef({ width: 0, height: 0 });
  const pointerOffsetRef = useRef(new Coordinates({ x: 0, y: 0 }));
  const pointerBoundariesRef = useRef<null | Coordinates>(null);
  const [transition, setTransition] = useState<null | Transition>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const draggableApi = useDraggable({ item, getElement: () => itemRef.current! });

  const onPointerMove = useThrottledEventHandler((event: PointerEvent) => {
    const coordinates = Coordinates.fromEvent(event);
    draggableApi.updateTransition(
      new Coordinates({
        x: Math.max(coordinates.x, pointerBoundariesRef.current?.x ?? Number.NEGATIVE_INFINITY),
        y: Math.max(coordinates.y, pointerBoundariesRef.current?.y ?? Number.NEGATIVE_INFINITY),
      })
    );
  }, 10);
  const onPointerUp = useStableEventHandler(() => {
    onPointerMove.cancel();
    draggableApi.submitTransition();
  });

  const gridContext = useGridContext();

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
        // TODO: fix this
        const itemMinSize = { width: 1, height: 2 };
        setTransition((transition) => ({
          operation,
          interactionType,
          itemId: draggableItem.id,
          sizeTransform: dropTarget
            ? {
                width: Math.max(
                  dropTarget.scale(itemMinSize).width,
                  Math.min(dropTarget.scale(itemMaxSize).width, width - pointerOffset.x)
                ),
                height: Math.max(dropTarget.scale(itemMinSize).height, height - pointerOffset.y),
              }
            : null,
          positionTransform: null,
          isBorrowed: !!transition?.isBorrowed,
        }));
      } else if (operation === "insert" || operation === "reorder") {
        setTransition((transition) => ({
          operation,
          interactionType,
          itemId: draggableItem.id,
          sizeTransform: dropTarget ? dropTarget.scale(itemSize) : originalSizeRef.current,
          positionTransform: { x: coordinates.x - pointerOffset.x, y: coordinates.y - pointerOffset.y },
          isBorrowed: !!transition?.isBorrowed,
        }));
      }
    }
  }

  useDragSubscription("start", (detail) => updateTransition(detail));
  useDragSubscription("update", (detail) => updateTransition(detail));
  useDragSubscription("submit", () => setTransition(null));
  useDragSubscription("discard", () => setTransition(null));
  useDragSubscription("acquire", (detail) => {
    if (detail.draggableItem.id === item.id) {
      setTransition((transition) => transition && { ...transition, isBorrowed: true });
    }
  });

  // During the transition listen to pointer move and pointer up events to update/submit transition.
  const transitionInteractionType = transition?.interactionType ?? null;
  const transitionItemId = transition?.itemId ?? null;
  useEffect(() => {
    if (transitionInteractionType === "pointer" && transitionItemId === item.id) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [item.id, transitionInteractionType, transitionItemId, onPointerMove, onPointerUp]);

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

      if (operation === "drag" && !gridContext) {
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
    draggableApi.acquire(nextDroppable);
  }

  function onHandleKeyDown(operation: "drag" | "resize", event: KeyboardEvent) {
    const canInsert = transition && operation === "drag" && !gridContext;
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
    // When drag- or resize handle loses focus the transition must be discarded with two exceptions:
    // 1. If the last interaction is not "keyboard" (the user clicked on another handle issuing a new transition);
    // 2. If the item is borrowed (in that case the focus moves to the acquired item which is expected).
    if (transition && transition.interactionType === "keyboard" && !transition.isBorrowed) {
      draggableApi.discardTransition();
    }
  }

  function onDragHandlePointerDown(event: ReactPointerEvent) {
    // Calculate the offset between item's top-left corner and the pointer landing position.
    const rect = itemRef.current!.getBoundingClientRect();
    pointerOffsetRef.current = new Coordinates({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    originalSizeRef.current = { width: rect.width, height: rect.height };
    pointerBoundariesRef.current = null;

    draggableApi.start(!gridContext ? "insert" : "reorder", "pointer", Coordinates.fromEvent(event));
  }

  function onDragHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("drag", event);
  }

  function onResizeHandlePointerDown(event: ReactPointerEvent) {
    // Calculate the offset between item's bottom-right corner and the pointer landing position.
    const rect = itemRef.current!.getBoundingClientRect();
    pointerOffsetRef.current = new Coordinates({ x: event.clientX - rect.right, y: event.clientY - rect.bottom });
    originalSizeRef.current = { width: rect.width, height: rect.height };

    // Calculate boundaries below which the cursor cannot move.
    // TODO: fix these
    const itemMinSize = { width: 1, height: 2 };
    const minWidth = gridContext?.getWidth(itemMinSize.width) ?? 0;
    const minHeight = gridContext?.getHeight(itemMinSize.height) ?? 0;
    pointerBoundariesRef.current = new Coordinates({
      x: event.clientX - rect.width + minWidth,
      y: event.clientY - rect.height + minHeight,
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

  if (transition) {
    // Adjust the dragged/resized item to the pointer's location.
    if (transition.interactionType === "pointer") {
      itemTransitionClassNames.push(transition.operation === "resize" ? styles.resized : styles.dragged);
      itemTransitionStyle.left = transition.positionTransform?.x;
      itemTransitionStyle.top = transition.positionTransform?.y;
      itemTransitionStyle.width = transition.sizeTransform?.width;
      itemTransitionStyle.height = transition.sizeTransform?.height;
      itemTransitionStyle.pointerEvents = "none";
    }
    // Make the borrowed item dimmed.
    else if (transition.isBorrowed) {
      itemTransitionClassNames.push(styles.borrowed);
    }
  }

  if (gridContext && transform) {
    // The moved items positions are altered with CSS transform.
    if (transform.type === "move") {
      itemTransitionClassNames.push(styles.transformed);
      itemTransitionStyle.transform = CSSUtil.Transform.toString({
        x: gridContext.getColOffset(transform.x),
        y: gridContext.getRowOffset(transform.y),
        scaleX: 1,
        scaleY: 1,
      });
      itemTransitionStyle.width = gridContext.getWidth(transform.width) + "px";
      itemTransitionStyle.height = gridContext.getHeight(transform.height) + "px";
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

  return (
    <div
      ref={itemRef}
      className={clsx(styles.root, ...itemTransitionClassNames)}
      style={itemTransitionStyle}
      data-item-id={item.id}
      onBlur={onBlur}
    >
      <Context.Provider
        value={{
          isActive: (!!transition && !transition.isBorrowed) || !!acquired,
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
