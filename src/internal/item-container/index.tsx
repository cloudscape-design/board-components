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
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { DragAndDropData, Operation, useDragSubscription, useDraggable } from "../dnd-controller/controller";
import { useGridContext } from "../grid-context";
import { DashboardItemBase, Direction, ItemId, Transform } from "../interfaces";
import { Coordinates } from "../utils/coordinates";
import { getMinItemSize } from "../utils/layout";
import { getNextDroppable } from "./get-next-droppable";
import styles from "./styles.css.js";
import { useAutoScroll } from "./use-auto-scroll";

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
  interactionType: "pointer" | "manual";
}

interface TransitionContext {
  interactionType: "pointer" | "manual";
  anchorPosition: Coordinates;
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
  const transitionContextRef = useRef<TransitionContext>({
    anchorPosition: new Coordinates({ x: 0, y: 0 }),
    interactionType: "pointer",
  });
  const [transition, setTransition] = useState<null | Transition>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scroll, setScroll] = useState({ x: window.scrollX, y: window.scrollY });
  const itemRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const draggableApi = useDraggable({ item, getElement: () => itemRef.current! });
  const { onManualMove, ...activeScrollHandlers } = useAutoScroll();
  const eventHandlersRef = useRef({
    onPointerMove: (event: PointerEvent) => {
      draggableApi.updateTransition(Coordinates.fromEvent(event));
      activeScrollHandlers.onPointerMove(event);
    },
    onPointerUp: () => {
      draggableApi.submitTransition();
      activeScrollHandlers.onPointerUp();
    },
  });
  const gridContext = useGridContext();

  const currentIsDragging = !!transition;

  function updateTransition({ operation, draggableItem, draggableSize, cursorOffset, dropTarget }: DragAndDropData) {
    setDragActive(true);

    if (item.id === draggableItem.id) {
      setScroll({ x: window.scrollX, y: window.scrollY });

      if (operation === "resize") {
        const { width: minWidth, height: minHeight } = dropTarget!.scale(getMinItemSize(draggableItem));
        const { width: maxWidth } = dropTarget!.scale(itemMaxSize);
        setTransition({
          operation,
          itemId: draggableItem.id,
          sizeTransform: {
            width: Math.max(minWidth, Math.min(maxWidth, draggableSize.width + cursorOffset.x)),
            height: Math.max(minHeight, draggableSize.height + cursorOffset.y),
          },
          positionTransform: null,
          interactionType: transitionContextRef.current.interactionType,
        });
      } else {
        setTransition({
          operation,
          itemId: draggableItem.id,
          sizeTransform: dropTarget ? dropTarget.scale(itemSize) : draggableSize,
          positionTransform: cursorOffset,
          interactionType: transitionContextRef.current.interactionType,
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
    if (currentIsDragging) {
      const listener = () => setScroll({ x: window.scrollX, y: window.scrollY });
      document.addEventListener("scroll", listener);
      return () => document.removeEventListener("scroll", listener);
    }
  }, [currentIsDragging]);

  function onKeyboardTransitionToggle(operation: "drag" | "resize") {
    if (!transition) {
      const rect = itemRef.current!.getBoundingClientRect();
      const coordiantes = new Coordinates({
        x: operation === "drag" ? rect.left : rect.right,
        y: operation === "drag" ? rect.top : rect.bottom,
      });
      const anchorRect = anchorRef.current!.getBoundingClientRect();

      transitionContextRef.current.interactionType = "manual";
      transitionContextRef.current.anchorPosition = new Coordinates({
        x: anchorRect.x + window.scrollX,
        y: anchorRect.y + window.scrollY,
      });

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
    if (transition && transitionContextRef.current.interactionType === "manual") {
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
    const dx = transitionContextRef.current.anchorPosition.x - anchorRect.x - window.scrollX;
    const dy = transitionContextRef.current.anchorPosition.y - anchorRect.y - window.scrollY;
    const droppableRect = nextDroppable.element.getBoundingClientRect();

    // Update active element for its collisions to be properly calculated.
    itemRef.current!.style.width = nextDroppable.scale(itemSize).width + "px";
    itemRef.current!.style.height = nextDroppable.scale(itemSize).height + "px";

    draggableApi.updateTransition(new Coordinates({ x: droppableRect.left + dx, y: droppableRect.top + dy }));
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
      transform: CSSUtil.Transform.toString({
        x: (transition.positionTransform?.x ?? 0) - scroll.x,
        y: (transition.positionTransform?.y ?? 0) - scroll.y,
        scaleX: 1,
        scaleY: 1,
      }),
      position: transition ? "fixed" : undefined,
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
    transition && (transition.interactionType === "pointer" || transition.operation === "insert")
      ? getDragActiveStyles(transition)
      : getLayoutShiftStyles();

  useEffect(() => {
    if (transition?.interactionType === "manual") {
      return onManualMove();
    }
  }, [onManualMove, transition?.interactionType, transform?.y, transform?.height]);

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
    <>
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
      <div ref={anchorRef} style={{ position: "absolute", top: 0, left: 0, visibility: "hidden" }}></div>
    </>
  );
}
