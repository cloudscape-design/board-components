// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil, Transform } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, useRef, useState } from "react";
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
  const { id, transform, resizable } = useItemContext();
  const [dragTransform, setDragTransform] = useState<Transform | null>(null);
  const [sizeOverride, setSizeOverride] = useState<{ width: number; height: number } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragOriginRef = useRef<DragOrigin | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragApi = useDraggable({ id, containerRef, resize: false });
  const resizeApi = useDraggable({ id, containerRef, resize: true });
  const currentIsDragging = activeDragId === id;

  useDragSubscription("start", ({ id: activeId, containerRef, coordinates }) => {
    setActiveDragId(activeId);
    if (activeId === id) {
      dragOriginRef.current = {
        rect: containerRef.current!.getBoundingClientRect(),
        cursor: coordinates,
      };
    }
  });
  useDragSubscription("move", ({ id: activeId, resize, coordinates }) => {
    const origin = dragOriginRef.current!;
    if (activeId === id) {
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
    setActiveDragId(null);
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
      activeDragId && !currentIsDragging
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
