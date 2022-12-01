// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil, Transform } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, useRef, useState } from "react";
import { GAP } from "../internal/constants";
import { useDragSubscription, useDraggable } from "../internal/dnd-controller";
import DragHandle from "../internal/drag-handle";
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

export default function DashboardItem({
  children,
  header,
  settings,
  i18nStrings,
  ...containerProps
}: DashboardItemProps) {
  const { item, itemSize, transform, resizable } = useItemContext();
  const [dragTransform, setDragTransform] = useState<Transform | null>(null);
  const [sizeOverride, setSizeOverride] = useState<{ width: number; height: number } | null>(null);
  const [activeItemId, setActiveItemId] = useState<null | string>(null);
  const dragOriginRef = useRef<null | DragOrigin>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragApi = useDraggable({ item, containerRef, resize: false });
  const resizeApi = useDraggable({ item, containerRef, resize: true });
  const currentIsDragging = activeItemId === item.id;

  useDragSubscription("start", ({ item: activeItem, containerRef, coordinates }) => {
    setActiveItemId(activeItem.id);
    if (activeItem.id === item.id) {
      dragOriginRef.current = {
        rect: containerRef.current!.getBoundingClientRect(),
        cursor: coordinates,
      };
    }
  });
  useDragSubscription("move", ({ item: activeItem, resize, coordinates, droppables }) => {
    const origin = dragOriginRef.current!;
    if (activeItem.id === item.id) {
      const cellRect = droppables[0][1].getBoundingClientRect();
      const maxWidth = cellRect.width * itemSize.width + GAP * (itemSize.width - 1);
      const maxHeight = cellRect.height * itemSize.height + GAP * (itemSize.height - 1);

      if (resize) {
        setSizeOverride({
          width: Math.max(cellRect.width, Math.min(maxWidth, origin.rect.width + (coordinates.x - origin.cursor.x))),
          height: Math.max(
            cellRect.height,
            Math.min(maxHeight, origin.rect.height + (coordinates.y - origin.cursor.y))
          ),
        });
      } else {
        setSizeOverride({ width: maxWidth, height: maxHeight });
        setDragTransform({
          x: coordinates.x - origin.cursor.x,
          y: coordinates.y - origin.cursor.y,
          scaleX: 1,
          scaleY: 1,
        });
      }
    }
  });
  useDragSubscription("drop", () => {
    setActiveItemId(null);
    setSizeOverride(null);
    setDragTransform(null);
    dragOriginRef.current = null;
  });

  const style: CSSProperties = {
    transform: CSSUtil.Transform.toString(currentIsDragging ? dragTransform : transform),
    position: currentIsDragging && sizeOverride ? "absolute" : undefined,
    width: currentIsDragging ? sizeOverride?.width : undefined,
    height: currentIsDragging ? sizeOverride?.height : undefined,
    transition:
      activeItemId && !currentIsDragging
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
  };
  return (
    <div ref={containerRef} className={clsx(styles.root, currentIsDragging && styles.wrapperDragging)} style={style}>
      <Container
        {...containerProps}
        disableHeaderPaddings={true}
        header={
          <WidgetContainerHeader
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
        {children}
      </Container>
      {resizable && (
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
