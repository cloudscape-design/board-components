// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil, Transform } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, useRef, useState } from "react";
import { GAP, ROW_HEIGHT } from "../internal/constants";
import { useDragSubscription, useDraggable } from "../internal/dnd-controller";
import DragHandle from "../internal/drag-handle";
import { Coordinates } from "../internal/interfaces";
import { useItemContext } from "../internal/item-context";
import ResizeHandle from "../internal/resize-handle";
import { isIntersecting } from "../internal/utils/geometry";
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
  useDragSubscription("move", ({ item: activeItem, resize, coordinates, dashboards }) => {
    const itemEl = containerRef.current!;
    const origin = dragOriginRef.current!;
    if (activeItem.id === item.id) {
      const itemRect = itemEl.getBoundingClientRect();
      const dashboardRects = dashboards.map(([, { element, columns }]) => ({
        rect: element.getBoundingClientRect(),
        columns,
      }));
      const dashboard = dashboardRects.find(({ rect }) => isIntersecting(rect, itemRect));
      const baseHeight = dashboard ? ROW_HEIGHT : 0;
      const baseWidth = dashboard ? (dashboard.rect.width - (dashboard.columns - 1) * GAP) / dashboard.columns : 0;
      const maxWidth = baseWidth * itemSize.width + GAP * (itemSize.width - 1);
      const maxHeight = baseHeight * itemSize.height + GAP * (itemSize.height - 1);

      if (resize) {
        setSizeOverride({
          width: Math.min(maxWidth, origin.rect.width + (coordinates.pageX - origin.cursor.pageX)),
          height: Math.min(maxHeight, origin.rect.height + (coordinates.pageY - origin.cursor.pageY)),
        });
      } else {
        setDragTransform({
          x: coordinates.pageX - origin.cursor.pageX,
          y: coordinates.pageY - origin.cursor.pageY,
          scaleX: 1,
          scaleY: 1,
        });
        setSizeOverride(dashboard ? { width: maxWidth, height: maxHeight } : null);
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

  const itemHeight = currentIsDragging
    ? sizeOverride?.height ?? 0
    : itemSize.height * ROW_HEIGHT + (itemSize.height - 1) * GAP;
  const [headerHeight, headerQueryRef] = useContainerQuery((entry) => entry.borderBoxHeight);
  const contentHeight = itemHeight - (headerHeight ?? 0);

  return (
    <div ref={containerRef} className={clsx(styles.wrapper, currentIsDragging && styles.wrapperDragging)} style={style}>
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
        <div className={styles.content} style={{ maxHeight: contentHeight }}>
          {children}
        </div>
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
