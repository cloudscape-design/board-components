// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import {
  CSSProperties,
  KeyboardEvent,
  ReactNode,
  Ref,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { DragAndDropData, Operation, useDragSubscription, useDraggable } from "../dnd-controller/controller";
import { useGridContext } from "../grid-context";
import { Coordinates, DashboardItemBase, Direction, ItemId, Transform } from "../interfaces";
import { getCoordinates } from "../utils/get-coordinates";
import { getNextDroppable } from "./get-next-droppable";
import styles from "./styles.css.js";

export interface ItemContainerRef {
  focusDragHandle(): void;
}

export interface ItemContext {
  dragHandle: {
    ref: React.RefObject<HTMLButtonElement>;
    onPointerDown(coordinates: Coordinates): void;
    onKeyDown(event: KeyboardEvent): void;
  };
  resizeHandle: null | {
    onPointerDown(coordinates: Coordinates): void;
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

interface ItemContainerProps {
  item: DashboardItemBase<unknown>;
  itemSize: { width: number; height: number };
  itemMaxSize: { width: number; height: number };
  transform: null | Transform;
  onNavigate(direction: Direction): void;
  children: ReactNode;
}

export const ItemContainer = forwardRef(ItemContainerComponent);

function ItemContainerComponent(
  { item, itemSize, itemMaxSize, transform, onNavigate, children }: ItemContainerProps,
  ref: Ref<ItemContainerRef>
) {
  const [transition, setTransition] = useState<null | Transition>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scroll, setScroll] = useState({ x: window.scrollX, y: window.scrollY });
  const [interactionType, setInteractionType] = useState<"pointer" | "manual">("pointer");
  const itemRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorPositionRef = useRef({ x: 0, y: 0 });
  const draggableApi = useDraggable({ item, getElement: () => itemRef.current! });
  const eventHandlersRef = useRef({
    onPointerMove: (event: PointerEvent) => draggableApi.updateTransition(getCoordinates(event)),
    onPointerUp: () => draggableApi.submitTransition(),
  });
  const gridContext = useGridContext();

  function updateTransition({ operation, draggableItem, draggableSize, cursorOffset, dropTarget }: DragAndDropData) {
    setDragActive(true);

    if (item.id === draggableItem.id) {
      setScroll({ x: window.scrollX, y: window.scrollY });

      if (operation === "resize") {
        const { width: cellWidth, height: cellHeight } = dropTarget!.scale({ width: 1, height: 1 });
        const { width: maxWidth } = dropTarget!.scale(itemMaxSize);
        setTransition({
          operation,
          itemId: draggableItem.id,
          sizeTransform: {
            width: Math.max(cellWidth, Math.min(maxWidth, draggableSize.width + cursorOffset.x)),
            height: Math.max(cellHeight, draggableSize.height + cursorOffset.y),
          },
          positionTransform: null,
        });
      } else {
        setTransition({
          operation,
          itemId: draggableItem.id,
          sizeTransform: dropTarget ? dropTarget.scale(itemSize) : null,
          positionTransform: cursorOffset,
        });
      }
    }
  }

  useDragSubscription("start", (detail) => {
    updateTransition(detail);

    if (interactionType === "pointer" && item.id === detail.draggableItem.id) {
      window.addEventListener("pointermove", eventHandlersRef.current.onPointerMove);
      window.addEventListener("pointerup", eventHandlersRef.current.onPointerUp);
    }
  });

  useDragSubscription("update", (detail) => updateTransition(detail));

  useDragSubscription("submit", () => {
    setDragActive(false);
    setTransition(null);
    window.removeEventListener("pointermove", eventHandlersRef.current.onPointerMove);
    window.removeEventListener("pointerup", eventHandlersRef.current.onPointerUp);
  });

  useDragSubscription("discard", () => {
    setDragActive(false);
    setTransition(null);
    window.removeEventListener("pointermove", eventHandlersRef.current.onPointerMove);
    window.removeEventListener("pointerup", eventHandlersRef.current.onPointerUp);
  });

  useEffect(() => {
    const listener = () => setScroll({ x: window.scrollX, y: window.scrollY });
    document.addEventListener("scroll", listener);
    return () => document.removeEventListener("scroll", listener);
  });

  function onKeyboardTransitionToggle(operation: "drag" | "resize") {
    if (!transition) {
      const rect = itemRef.current!.getBoundingClientRect();
      const coordiantes: Coordinates = {
        __type: "Coordinates",
        x: operation === "drag" ? rect.left : rect.right,
        y: operation === "drag" ? rect.top : rect.bottom,
      };

      setInteractionType("manual");

      // Timeout allows interaction type state to propagate.
      setTimeout(() => {
        if (operation === "drag" && !gridContext) {
          draggableApi.start("insert", coordiantes);
        } else if (operation === "drag") {
          draggableApi.start("reorder", coordiantes);
        } else {
          draggableApi.start("resize", coordiantes);
        }
      }, 0);

      const anchorRect = anchorRef.current!.getBoundingClientRect();
      anchorPositionRef.current = { x: anchorRect.x + window.scrollX, y: anchorRect.y + window.scrollY };
    } else {
      draggableApi.submitTransition();
    }
  }

  function onKeyboardTransitionDiscard() {
    if (transition) {
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
    const anchorRect = anchorRef.current!.getBoundingClientRect();
    const droppableRect = nextDroppable[1].element.getBoundingClientRect();
    const dx = anchorPositionRef.current.x - anchorRect.x - window.scrollX;
    const dy = anchorPositionRef.current.y - anchorRect.y - window.scrollY;
    draggableApi.updateTransition({ __type: "Coordinates", x: droppableRect.x + dx, y: droppableRect.y + dy });
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

  function onDragHandlePointerDown(coordinates: Coordinates) {
    draggableApi.start(!gridContext ? "insert" : "reorder", coordinates);
    setInteractionType("pointer");
  }

  function onDragHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("drag", event);
  }

  function onResizeHandlePointerDown(coordinates: Coordinates) {
    draggableApi.start("resize", coordinates);
    setInteractionType("pointer");
  }

  function onResizeHandleKeyDown(event: KeyboardEvent) {
    onHandleKeyDown("resize", event);
  }

  function getDragActiveStyles(transition: Transition): CSSProperties {
    return {
      transform: CSSUtil.Transform.toString({
        x: (transition.positionTransform?.x ?? 0) - scroll.x,
        y: (transition.positionTransform?.y ?? 0) - scroll.y,
        scaleX: 1,
        scaleY: 1,
      }),
      position: transition?.sizeTransform ? "fixed" : undefined,
      zIndex: 5000,
      width: transition?.sizeTransform?.width,
      height: transition?.sizeTransform?.height,
    };
  }

  function getLayoutShiftStyles(): CSSProperties {
    const transitionStyle = dragActive
      ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
      : undefined;

    if (!transform || !gridContext) {
      return { transition: transitionStyle };
    }

    const shouldTransformSize = transform.width > 1 || transform.height > 1;

    return {
      transform: CSSUtil.Transform.toString({
        x: gridContext.getColOffset(transform.x),
        y: gridContext.getRowOffset(transform.y),
        scaleX: 1,
        scaleY: 1,
      }),
      position: shouldTransformSize ? "absolute" : undefined,
      width: shouldTransformSize ? gridContext.getWidth(transform.width) : undefined,
      height: shouldTransformSize ? gridContext.getHeight(transform.height) : undefined,
      transition: transitionStyle,
    };
  }

  const style =
    transition && (interactionType === "pointer" || transition.operation === "insert")
      ? getDragActiveStyles(transition)
      : getLayoutShiftStyles();

  const dragHandleRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => ({
    focusDragHandle: () => dragHandleRef.current?.focus(),
  }));

  return (
    <>
      <div
        ref={itemRef}
        className={styles.root}
        style={style}
        data-item-id={item.id}
        onBlur={onKeyboardTransitionDiscard}
      >
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
      <div ref={anchorRef} style={{ position: "absolute", top: 0, left: 0, visibility: "hidden" }}></div>
    </>
  );
}
