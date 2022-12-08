// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, KeyboardEvent, useEffect, useRef, useState } from "react";
import { DragAndDropData, useDragSubscription, useDraggable } from "../internal/dnd-controller/pointer-controller";
import DragHandle from "../internal/drag-handle";
import { useGridContext } from "../internal/grid-context";
import { Coordinates, Direction } from "../internal/interfaces";
import { useItemContext } from "../internal/item-context";
import ResizeHandle from "../internal/resize-handle";
import { getNextDroppable } from "./get-next-droppable";
import WidgetContainerHeader from "./header";
import type { DashboardItemProps } from "./interfaces";
import styles from "./styles.css.js";

export type { DashboardItemProps };

interface Transition {
  itemId: string;
  sizeOverride: null | { width: number; height: number };
  transform: null | { x: number; y: number };
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
  const [manualInsert, setManualInsert] = useState(false);
  const [scroll, setScroll] = useState({ x: window.scrollX, y: window.scrollY });
  const [interactionType, setInteractionType] = useState<"pointer" | "manual">("pointer");
  const itemRef = useRef<HTMLDivElement>(null);
  const ankerRef = useRef<HTMLDivElement>(null);
  const ankerPositionRef = useRef({ x: 0, y: 0 });
  const draggableApi = useDraggable({ item, getElement: () => itemRef.current! });
  const gridContext = useGridContext();

  function updateTransition({ operation, draggableItem, draggableSize, cursorOffset, dropTarget }: DragAndDropData) {
    setDragActive(true);

    if (item.id === draggableItem.id) {
      setScroll({ x: window.scrollX, y: window.scrollY });

      if (operation === "resize") {
        const { width: cellWidth, height: cellHeight } = dropTarget!.scale({ width: 1, height: 1 });
        const { width: maxWidth } = dropTarget!.scale(itemMaxSize);
        setTransition({
          itemId: draggableItem.id,
          sizeOverride: {
            width: Math.max(cellWidth, Math.min(maxWidth, draggableSize.width + cursorOffset.x)),
            height: Math.max(cellHeight, draggableSize.height + cursorOffset.y),
          },
          transform: null,
        });
      } else {
        setTransition({
          itemId: draggableItem.id,
          sizeOverride: dropTarget ? dropTarget.scale(itemSize) : null,
          transform: cursorOffset,
        });
      }
    }
  }

  useDragSubscription("start", (detail) => updateTransition(detail));
  useDragSubscription("move", (detail) => updateTransition(detail));
  useDragSubscription("drop", () => {
    setDragActive(false);
    setTransition(null);
    setManualInsert(false);
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
      if (operation === "drag") {
        draggableApi.startMove(coordiantes, "manual");
      } else {
        draggableApi.startResize(coordiantes, "manual");
      }
      setInteractionType("manual");
      const ankerRect = ankerRef.current!.getBoundingClientRect();
      ankerPositionRef.current = { x: ankerRect.x + window.scrollX, y: ankerRect.y + window.scrollY };
    } else {
      draggableApi.endTransition();
    }
  }

  function onKeyboardTransitionDiscard() {
    if (transition) {
      draggableApi.cancelTransition();
    }
  }

  function handleInsert(direction: Direction) {
    const droppables = draggableApi.getDroppables();
    const nextDroppable = getNextDroppable(itemRef.current!, droppables, direction);
    if (!nextDroppable) {
      // TODO: add announcement
      return;
    }
    const ankerRect = ankerRef.current!.getBoundingClientRect();
    const droppableRect = nextDroppable[1].element.getBoundingClientRect();
    setManualInsert(true);
    const dx = ankerPositionRef.current.x - ankerRect.x - window.scrollX;
    const dy = ankerPositionRef.current.y - ankerRect.y - window.scrollY;
    draggableApi.insert({ __type: "Coordinates", x: droppableRect.x + dx, y: droppableRect.y + dy });
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
    draggableApi.startMove(coordinates, "pointer");
    setInteractionType("pointer");
  }

  function onResizeHandlePointerDown(coordinates: Coordinates) {
    draggableApi.startResize(coordinates, "pointer");
    setInteractionType("pointer");
  }

  function getDragActiveStyles(transition: Transition): CSSProperties {
    return {
      transform: CSSUtil.Transform.toString({
        x: (transition.transform?.x ?? 0) - scroll.x,
        y: (transition.transform?.y ?? 0) - scroll.y,
        scaleX: 1,
        scaleY: 1,
      }),
      position: transition?.sizeOverride ? "fixed" : undefined,
      zIndex: 5000,
      width: transition?.sizeOverride?.width,
      height: transition?.sizeOverride?.height,
    };
  }

  function getLayoutShiftStyles(): CSSProperties {
    const transitionStyle = dragActive
      ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
      : undefined;

    if (!transform || !gridContext) {
      return { transition: transitionStyle };
    }

    const shouldTransformSize = transform.scaleX > 1 || transform.scaleY > 1;

    return {
      transform: CSSUtil.Transform.toString({
        x: gridContext.getColOffset(transform.x),
        y: gridContext.getRowOffset(transform.y),
        scaleX: 1,
        scaleY: 1,
      }),
      position: shouldTransformSize ? "absolute" : undefined,
      width: shouldTransformSize ? gridContext.getWidth(transform.scaleX) : undefined,
      height: shouldTransformSize ? gridContext.getHeight(transform.scaleY) : undefined,
      transition: transitionStyle,
    };
  }

  const style =
    transition && (interactionType === "pointer" || manualInsert)
      ? getDragActiveStyles(transition)
      : getLayoutShiftStyles();

  let maxBodyWidth = gridContext ? gridContext.getWidth(itemSize.width) : undefined;
  let maxBodyHeight = gridContext ? gridContext.getHeight(itemSize.height) : undefined;
  if (transition?.sizeOverride) {
    maxBodyWidth = transition.sizeOverride.width;
    maxBodyHeight = transition.sizeOverride.height;
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
      <div ref={ankerRef} style={{ position: "absolute", top: 0, left: 0, visibility: "hidden" }}></div>
    </>
  );
}
