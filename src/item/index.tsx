// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil, Transform } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, useRef, useState } from "react";
import { DragAndDropData, useDragSubscription, useDraggable } from "../internal/dnd-controller";
import DragHandle from "../internal/drag-handle";
import { useGridContext } from "../internal/grid-context";
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
  const { item, itemSize, transform } = useItemContext();
  const [transition, setTransition] = useState<null | Transition>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const draggableApi = useDraggable({ item, getElement: () => itemRef.current! });
  const currentIsDragging = transition?.itemId === item.id;
  const gridContext = useGridContext();

  function updateTransition({ operation, draggableItem, draggableSize, cursorOffset, dropTarget }: DragAndDropData) {
    if (operation === "resize") {
      const { width: cellWidth, height: cellHeight } = dropTarget!.scale({ width: 1, height: 1 });
      const { width, height } = dropTarget!.scale(itemSize);

      setTransition({
        itemId: draggableItem.id,
        sizeOverride: {
          width: Math.max(cellWidth, Math.min(width, draggableSize.width + cursorOffset.x)),
          height: Math.max(cellHeight, Math.min(height, draggableSize.height + cursorOffset.y)),
        },
        transform: null,
      });
    } else {
      setTransition({
        itemId: draggableItem.id,
        sizeOverride: dropTarget ? dropTarget.scale(itemSize) : null,
        transform: { x: cursorOffset.x, y: cursorOffset.y, scaleX: 1, scaleY: 1 },
      });
    }
  }

  useDragSubscription("start", (detail) => updateTransition(detail));
  useDragSubscription("move", (detail) => updateTransition(detail));
  useDragSubscription("drop", () => setTransition(null));

  const scaledTransform: null | Transform =
    transform && gridContext
      ? {
          x: gridContext.getColOffset(transform.x),
          y: gridContext.getRowOffset(transform.y),
          scaleX: 1,
          scaleY: 1,
        }
      : null;

  const style: CSSProperties = {
    transform: CSSUtil.Transform.toString(currentIsDragging ? transition.transform : scaledTransform),
    position: currentIsDragging && transition?.sizeOverride ? "absolute" : undefined,
    width: currentIsDragging ? transition?.sizeOverride?.width : undefined,
    height: currentIsDragging ? transition?.sizeOverride?.height : undefined,
    transition:
      transition && !currentIsDragging
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
  };

  let maxBodyWidth = gridContext ? gridContext.getWidth(itemSize.width) : undefined;
  let maxBodyHeight = gridContext ? gridContext.getHeight(itemSize.height) : undefined;
  if (transition?.sizeOverride && currentIsDragging) {
    maxBodyWidth = transition.sizeOverride.width;
    maxBodyHeight = transition.sizeOverride.height;
  }

  return (
    <div ref={itemRef} className={clsx(styles.root, currentIsDragging && styles.wrapperDragging)} style={style}>
      <Container disableContentPaddings={true}>
        <div className={styles.body} style={{ maxWidth: maxBodyWidth, maxHeight: maxBodyHeight }}>
          <WidgetContainerHeader
            handle={
              <DragHandle
                ariaLabel={i18nStrings.dragHandleLabel}
                onPointerDown={(coordinates) => draggableApi.startMove(coordinates)}
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
            onPointerDown={(coordinates) => draggableApi.startResize(coordinates)}
          />
        </div>
      )}
    </div>
  );
}
