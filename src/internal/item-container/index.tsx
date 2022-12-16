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
import { getNextDroppable } from "./get-next-droppable";
import styles from "./styles.css.js";

export interface ItemContainerRef {
  focusDragHandle(): void;
}

export interface ItemContext {
  contentWidth?: number;
  contentHeight?: number;
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
  interactionType: "pointer" | "keyboard";
  isBorrowed: boolean;
}

interface TransitionContext {
  interactionType: "pointer" | "keyboard";
  isBorrowed: boolean;
}

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
  const transitionContextRef = useRef<TransitionContext>({ interactionType: "pointer", isBorrowed: false });
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

      if (operation === "resize") {
        const { width: minWidth, height: minHeight } = dropTarget!.scale(getMinItemSize(draggableItem));
        const { width: maxWidth } = dropTarget!.scale(itemMaxSize);
        setTransition({
          operation,
          itemId: draggableItem.id,
          sizeTransform: {
            width: Math.max(minWidth, Math.min(maxWidth, width)),
            height: Math.max(minHeight, height),
          },
          positionTransform: null,
          ...transitionContextRef.current,
        });
      } else {
        setTransition({
          operation,
          itemId: draggableItem.id,
          sizeTransform: dropTarget ? dropTarget.scale(itemSize) : { width, height },
          positionTransform: { x: coordinates.x - 32, y: coordinates.y - 32 },
          ...transitionContextRef.current,
        });
      }
    }
  }

  useDragSubscription("start", (detail) => {
    updateTransition(detail);

    if (transitionContextRef.current.interactionType === "pointer" && item.id === detail.draggableItem.id) {
      window.addEventListener("pointermove", eventHandlersRef.current.onPointerMove);
      window.addEventListener("pointerup", eventHandlersRef.current.onPointerUp);
    }
  });

  useDragSubscription("update", (detail) => updateTransition(detail));

  useDragSubscription("submit", () => {
    transitionContextRef.current.isBorrowed = false;
    setDragActive(false);
    setTransition(null);
    window.removeEventListener("pointermove", eventHandlersRef.current.onPointerMove);
    window.removeEventListener("pointerup", eventHandlersRef.current.onPointerUp);
  });

  useDragSubscription("discard", () => {
    transitionContextRef.current.isBorrowed = false;
    setDragActive(false);
    setTransition(null);
    window.removeEventListener("pointermove", eventHandlersRef.current.onPointerMove);
    window.removeEventListener("pointerup", eventHandlersRef.current.onPointerUp);
  });

  function onKeyboardTransitionToggle(operation: "drag" | "resize") {
    if (acquired) {
      draggableApi.submitTransition();
    }

    if (!transition) {
      const rect = getNormalizedElementRect(itemRef.current!);
      const coordiantes = new Coordinates({
        x: operation === "drag" ? rect.left : rect.right,
        y: operation === "drag" ? rect.top : rect.bottom,
      });

      transitionContextRef.current.interactionType = "keyboard";

      if (operation === "drag" && !gridContext) {
        draggableApi.start("insert", coordiantes);
      } else if (operation === "drag") {
        draggableApi.start("reorder", coordiantes);
      } else {
        draggableApi.start("resize", coordiantes);
      }
    } else {
      draggableApi.submitTransition();
    }
  }

  function onKeyboardTransitionDiscard() {
    const { interactionType, isBorrowed } = transitionContextRef.current;

    if (transition && interactionType === "keyboard" && !isBorrowed) {
      draggableApi.discardTransition();
    }
  }

  function handleInsert(direction: Direction) {
    const droppables = draggableApi.getDroppables();
    const nextDroppable = getNextDroppable(itemRef.current!, droppables, direction);
    if (!nextDroppable) {
      // TODO: add announcement
      return;
    }

    transitionContextRef.current.isBorrowed = true;
    setTransition((prev) => prev && { ...prev, isBorrowed: true });

    nextDroppable.context.acquire();
  }

  function onHandleKeyDown(operation: "drag" | "resize", event: KeyboardEvent) {
    const canInsert = transition && operation === "drag" && !gridContext;
    const canNavigate = transition || operation === "drag";
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
        return onKeyboardTransitionDiscard();
    }
  }

  function onDragHandlePointerDown(event: ReactPointerEvent) {
    transitionContextRef.current.interactionType = "pointer";
    draggableApi.start(!gridContext ? "insert" : "reorder", Coordinates.fromEvent(event));
  }

  function onDragHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("drag", event);
  }

  function onResizeHandlePointerDown(event: ReactPointerEvent) {
    transitionContextRef.current.interactionType = "pointer";
    draggableApi.start("resize", Coordinates.fromEvent(event));
  }

  function onResizeHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("resize", event);
  }

  function getDragActiveStyles(transition: Transition): CSSProperties {
    return {
      left: transition.positionTransform?.x,
      top: transition.positionTransform?.y,
      position: transition ? "fixed" : undefined,
      zIndex: 5000,
      width: transition?.sizeTransform?.width,
      height: transition?.sizeTransform?.height,
    };
  }

  function getLayoutShiftStyles(): CSSProperties {
    if (transition?.isBorrowed) {
      return { opacity: 0.5 };
    }

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

  const style =
    transition && transition.interactionType === "pointer" ? getDragActiveStyles(transition) : getLayoutShiftStyles();

  let maxBodyWidth = gridContext ? gridContext.getWidth(itemSize.width) : undefined;
  let maxBodyHeight = gridContext ? gridContext.getHeight(itemSize.height) : undefined;
  if (transition?.sizeTransform) {
    maxBodyWidth = transition.sizeTransform.width;
    maxBodyHeight = transition.sizeTransform.height;
  }

  const dragHandleRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => ({
    focusDragHandle: () => dragHandleRef.current?.focus(),
  }));

  return (
    <div ref={itemRef} className={styles.root} style={style} onBlur={onKeyboardTransitionDiscard}>
      <Context.Provider
        value={{
          contentWidth: maxBodyWidth,
          contentHeight: maxBodyHeight,
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
