// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil, Transform } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, useRef, useState } from "react";
import { GAP } from "../internal/constants";
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

interface DragOrigin {
  rect: DOMRect;
  cursor: Coordinates;
}

interface Transition {
  itemId: string;
  type: "reorder" | "resize" | "insert";
  sizeOverride: null | { width: number; height: number };
  transform: null | Transform;
}

export default function DashboardItem({
  children,
  header,
  settings,
  i18nStrings,
  ...containerProps
}: DashboardItemProps) {
  const { item, itemSize, transform } = useItemContext();
  const [transition, setTransition] = useState<null | Transition>(null);
  const dragOriginRef = useRef<null | DragOrigin>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragApi = useDraggable({ item, containerRef, resize: false });
  const resizeApi = useDraggable({ item, containerRef, resize: true });
  const currentIsDragging = transition?.itemId === item.id;
  const gridContext = useGridContext();

  function updateTransition({ item: activeItem, resize, coordinates, droppables }: DragAndDropData) {
    const type = resize ? "resize" : gridContext ? "reorder" : "insert";

    const origin = dragOriginRef.current!;
    if (activeItem.id === item.id) {
      // TODO: remove dependency on GAP from here.
      const cellRect = droppables[0][1].getBoundingClientRect();
      const width = gridContext
        ? gridContext.getWidth(itemSize.width)
        : cellRect.width * itemSize.width + GAP * (itemSize.width - 1);
      const height = gridContext
        ? gridContext.getHeight(itemSize.height)
        : cellRect.height * itemSize.height + GAP * (itemSize.height - 1);

      if (resize) {
        setTransition({
          itemId: activeItem.id,
          type,
          sizeOverride: {
            width: Math.max(cellRect.width, Math.min(width, origin.rect.width + (coordinates.x - origin.cursor.x))),
            height: Math.max(cellRect.height, Math.min(height, origin.rect.height + (coordinates.y - origin.cursor.y))),
          },
          transform: null,
        });
      } else {
        setTransition({
          itemId: activeItem.id,
          type,
          sizeOverride: type === "insert" ? { width, height } : null,
          transform: {
            x: coordinates.x - origin.cursor.x,
            y: coordinates.y - origin.cursor.y,
            scaleX: 1,
            scaleY: 1,
          },
        });
      }
    }
  }

  useDragSubscription("start", (detail) => {
    if (detail.item.id === item.id) {
      dragOriginRef.current = {
        rect: containerRef.current!.getBoundingClientRect(),
        cursor: detail.coordinates,
      };
    }

    updateTransition(detail);
  });
  useDragSubscription("move", (detail) => updateTransition(detail));
  useDragSubscription("drop", () => {
    setTransition(null);
    dragOriginRef.current = null;
  });

  const style: CSSProperties = {
    transform: CSSUtil.Transform.toString(currentIsDragging ? transition.transform : transform),
    position: currentIsDragging && transition?.sizeOverride ? "absolute" : undefined,
    width: currentIsDragging ? transition?.sizeOverride?.width : undefined,
    height: currentIsDragging ? transition?.sizeOverride?.height : undefined,
    transition:
      transition && !currentIsDragging
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
  };

  const [headerHeight, headerQueryRef] = useContainerQuery((entry) => entry.borderBoxHeight);
  let maxContentWidth = gridContext ? gridContext.getWidth(itemSize.width) : undefined;
  let maxContentHeight = gridContext ? gridContext.getHeight(itemSize.height) - (headerHeight || 0) : undefined;
  if (transition?.sizeOverride) {
    maxContentWidth = transition.sizeOverride.width;
    maxContentHeight = transition.sizeOverride.height - (headerHeight || 0);
  }

  return (
    <div ref={containerRef} className={clsx(styles.root, currentIsDragging && styles.wrapperDragging)} style={style}>
      <Container
        {...containerProps}
        disableHeaderPaddings={true}
        disableContentPaddings={true}
        header={
          <WidgetContainerHeader
            ref={headerQueryRef}
            handle={
              <DragHandle
                ariaLabel={i18nStrings.dragHandleLabel}
                onPointerDown={(coordinates) => dragApi.onStart(coordinates)}
              />
            }
            settings={settings}
          >
            {header}
          </WidgetContainerHeader>
        }
      >
        <div className={styles.content} style={{ maxWidth: maxContentWidth, maxHeight: maxContentHeight }}>
          {children}
        </div>
      </Container>
      {gridContext && (
        <div className={styles.resizer}>
          <ResizeHandle
            ariaLabel={i18nStrings.resizeLabel}
            onPointerDown={(coordinates) => resizeApi.onStart(coordinates)}
          />
        </div>
      )}
    </div>
  );
}
