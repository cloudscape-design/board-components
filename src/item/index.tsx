// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil, Transform } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, useRef, useState } from "react";
import { useDragSubscription, useDraggable } from "../internal/dnd-controller";
import DragHandle from "../internal/drag-handle";
import { Coordinates, DashboardItemBase } from "../internal/interfaces";
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
  const { item, transform, resizable } = useItemContext();
  const [dragTransform, setDragTransform] = useState<Transform | null>(null);
  const [sizeOverride, setSizeOverride] = useState<{ width: number; height: number } | null>(null);
  const [activeItem, setActiveItem] = useState<null | DashboardItemBase<unknown>>(null);
  const dragOriginRef = useRef<null | DragOrigin>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragApi = useDraggable({ item, containerRef, resize: false });
  const resizeApi = useDraggable({ item, containerRef, resize: true });
  const currentIsDragging = activeItem?.id === item.id;

  useDragSubscription("start", ({ item: activeItem, containerRef, coordinates }) => {
    setActiveItem(activeItem);
    if (activeItem.id === item.id) {
      dragOriginRef.current = {
        rect: containerRef.current!.getBoundingClientRect(),
        cursor: coordinates,
      };
    }
  });
  useDragSubscription("move", ({ item: activeItem, resize, coordinates }) => {
    const origin = dragOriginRef.current!;
    if (activeItem.id === item.id) {
      if (resize) {
        setSizeOverride({
          width: origin.rect.width + (coordinates.pageX - origin.cursor.pageX),
          height: origin.rect.height + (coordinates.pageY - origin.cursor.pageY),
        });
      } else {
        setDragTransform({
          x: coordinates.pageX - origin.cursor.pageX,
          y: coordinates.pageY - origin.cursor.pageY,
          scaleX: 1,
          scaleY: 1,
        });
      }
    }
  });
  useDragSubscription("drop", () => {
    setActiveItem(null);
    setSizeOverride(null);
    setDragTransform(null);
    dragOriginRef.current = null;
  });

  const style: CSSProperties = {
    transform: CSSUtil.Transform.toString(currentIsDragging ? dragTransform : transform),
    position: sizeOverride ? "absolute" : undefined,
    width: sizeOverride?.width,
    height: sizeOverride?.height,
    transition:
      activeItem && !currentIsDragging
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
  };
  return (
    <div ref={containerRef} className={clsx(styles.wrapper, currentIsDragging && styles.wrapperDragging)} style={style}>
      <Container
        {...containerProps}
        disableHeaderPaddings={true}
        header={
          <WidgetContainerHeader
            handle={
              <DragHandle
                onMouseDown={(event) => dragApi.onStart({ pageX: event.pageX, pageY: event.pageY })}
                ariaLabel={i18nStrings.dragHandleLabel}
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
            onResize={(event) => resizeApi.onStart({ pageX: event.pageX, pageY: event.pageY })}
          />
        </div>
      )}
    </div>
  );
}
