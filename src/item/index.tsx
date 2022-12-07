// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil, Transform } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, KeyboardEvent, useRef, useState } from "react";
import { DragAndDropData, useDragSubscription, useDraggable } from "../internal/dnd-controller";
import DragHandle from "../internal/drag-handle";
import { useGridContext } from "../internal/grid-context";
import { Coordinates } from "../internal/interfaces";
import { useItemContext } from "../internal/item-context";
import ResizeHandle from "../internal/resize-handle";
import WidgetContainerHeader from "./header";
import type { DashboardItemProps } from "./interfaces";
import styles from "./styles.css.js";

export type { DashboardItemProps };

interface Transition {
  itemId: string;
  sizeOverride: null | { width: number; height: number };
  transform: null | Transform;
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
  const [interactionType, setInteractionType] = useState<"pointer" | "manual">("pointer");
  const itemRef = useRef<HTMLDivElement>(null);
  const draggableApi = useDraggable({ item, getElement: () => itemRef.current! });
  const gridContext = useGridContext();

  function updateTransition({ operation, draggableItem, draggableSize, cursorOffset, dropTarget }: DragAndDropData) {
    setDragActive(true);

    if (item.id === draggableItem.id) {
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
          transform: { ...cursorOffset, scaleX: 1, scaleY: 1 },
        });
      }
    }
  }

  useDragSubscription("start", (detail) => updateTransition(detail));
  useDragSubscription("move", (detail) => updateTransition(detail));
  useDragSubscription("drop", () => {
    setDragActive(false);
    setTransition(null);
  });

  function onKeyboardTransitionToggle(operation: "drag" | "resize") {
    if (!transition) {
      const rect = itemRef.current!.getBoundingClientRect();
      const coordiantes: Coordinates = {
        __type: "Coordinates",
        x: operation === "drag" ? rect.left : rect.right,
        y: operation === "drag" ? rect.left : rect.bottom,
      };
      if (operation === "drag") {
        draggableApi.startMove(coordiantes, "manual");
      } else {
        draggableApi.startResize(coordiantes, "manual");
      }
      setInteractionType("manual");
    } else {
      draggableApi.endTransition();
    }
  }

  function onKeyboardTransitionDiscard() {
    if (transition) {
      draggableApi.cancelTransition();
    }
  }

  function onHandleKeyDown(operation: "drag" | "resize", event: KeyboardEvent) {
    const canNavigate = transition || operation === "drag";
    switch (event.key) {
      case "ArrowUp":
        return canNavigate && onNavigate("up");
      case "ArrowDown":
        return canNavigate && onNavigate("down");
      case "ArrowLeft":
        return canNavigate && onNavigate("left");
      case "ArrowRight":
        return canNavigate && onNavigate("right");
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
      transform: CSSUtil.Transform.toString(transition.transform),
      position: transition?.sizeOverride ? "absolute" : undefined,
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

  const style = transition && interactionType === "pointer" ? getDragActiveStyles(transition) : getLayoutShiftStyles();

  let maxBodyWidth = gridContext ? gridContext.getWidth(itemSize.width) : undefined;
  let maxBodyHeight = gridContext ? gridContext.getHeight(itemSize.height) : undefined;
  if (transition?.sizeOverride) {
    maxBodyWidth = transition.sizeOverride.width;
    maxBodyHeight = transition.sizeOverride.height;
  }

  return (
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
  );
}
