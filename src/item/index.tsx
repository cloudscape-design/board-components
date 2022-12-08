// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, KeyboardEvent, useEffect, useRef, useState } from "react";
import { DragAndDropData, Operation, useDragSubscription, useDraggable } from "../internal/dnd-controller/controller";
import DragHandle from "../internal/drag-handle";
import { useGridContext } from "../internal/grid-context";
import { Coordinates, Direction, ItemId } from "../internal/interfaces";
import { useItemContext } from "../internal/item-context";
import ResizeHandle from "../internal/resize-handle";
import { getCoordinates } from "../internal/utils/get-coordinates";
import { getNextDroppable } from "./get-next-droppable";
import WidgetContainerHeader from "./header";
import type { DashboardItemProps } from "./interfaces";
import styles from "./styles.css.js";

export type { DashboardItemProps };

interface Transition {
  itemId: ItemId;
  operation: Operation;
  sizeTransform: null | { width: number; height: number };
  positionTransform: null | { x: number; y: number };
}

export default function DashboardItem({
  children,
  header,
  settings,
  i18nStrings,
  disableContentPaddings,
  footer,
}: DashboardItemProps) {
  const { item, itemSize, itemMaxSize, transform, onNavigate } = useItemContext();
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
      if (operation === "drag" && !gridContext) {
        draggableApi.start("insert", coordiantes);
      } else if (operation === "drag") {
        draggableApi.start("reorder", coordiantes);
      } else {
        draggableApi.start("resize", coordiantes);
      }
      setInteractionType("manual");
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

  function onResizeHandlePointerDown(coordinates: Coordinates) {
    draggableApi.start("resize", coordinates);
    setInteractionType("pointer");
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

  let maxBodyWidth = gridContext ? gridContext.getWidth(itemSize.width) : undefined;
  let maxBodyHeight = gridContext ? gridContext.getHeight(itemSize.height) : undefined;
  if (transition?.sizeTransform) {
    maxBodyWidth = transition.sizeTransform.width;
    maxBodyHeight = transition.sizeTransform.height;
  }

  return (
    <>
      <div
        ref={itemRef}
        className={clsx(styles.root, transition && styles.wrapperDragging)}
        style={style}
        onBlur={onKeyboardTransitionDiscard}
      >
        <Container disableContentPaddings={true}>
          <div className={styles.body} style={{ maxWidth: maxBodyWidth, maxHeight: maxBodyHeight }}>
            <WidgetContainerHeader
              handle={
                <DragHandle
                  ariaLabel={i18nStrings.dragHandleLabel}
                  onPointerDown={onDragHandlePointerDown}
                  onKeyDown={(event) => onHandleKeyDown("drag", event)}
                />
              }
              settings={settings}
            >
              {header}
            </WidgetContainerHeader>

            <div
              className={clsx(styles["content-wrapper"], {
                [styles["content-wrapper-disable-paddings"]]: disableContentPaddings,
              })}
            >
              <div className={styles.content}>{children}</div>
            </div>

            {footer && <div className={styles.footer}>{footer}</div>}
          </div>
        </Container>
        {gridContext && (
          <div className={styles.resizer}>
            <ResizeHandle
              ariaLabel={i18nStrings.resizeLabel}
              onPointerDown={onResizeHandlePointerDown}
              onKeyDown={(event) => onHandleKeyDown("resize", event)}
            />
          </div>
        )}
      </div>
      <div ref={anchorRef} style={{ position: "absolute", top: 0, left: 0, visibility: "hidden" }}></div>
    </>
  );
}
