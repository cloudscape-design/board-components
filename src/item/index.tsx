// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil, Transform } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, useRef, useState } from "react";
import { DragAndDropData, useDragSubscription, useDraggable } from "../internal/dnd-controller";
import DragHandle from "../internal/drag-handle";
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
  ...containerProps
}: DashboardItemProps) {
  const { item, itemSize, transform } = useItemContext();
  const [transition, setTransition] = useState<null | Transition>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const getElementRef = useRef(() => itemRef.current!);
  const draggableProps = useDraggable({ item, getElement: getElementRef.current });
  const currentIsDragging = transition?.itemId === item.id;

  function updateTransition({ operation, draggableItem, draggableSize, cursorOffset, dropTarget }: DragAndDropData) {
    if (draggableItem.id === item.id) {
      if (operation === "resize") {
        const { width: cellWidth, height: cellHeight } = dropTarget!.scale.size({ width: 1, height: 1 });
        const { width, height } = dropTarget!.scale.size(itemSize);

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
          sizeOverride: dropTarget ? dropTarget.scale.size(itemSize) : null,
          transform: { x: cursorOffset.x, y: cursorOffset.y, scaleX: 1, scaleY: 1 },
        });
      }
    }
  }

  useDragSubscription("start", (detail) => updateTransition(detail));
  useDragSubscription("move", (detail) => updateTransition(detail));
  useDragSubscription("drop", () => setTransition(null));

  const scaledTransform: null | Transform =
    transform && draggableProps.layout
      ? {
          x: draggableProps.layout.scale.offset(transform).x,
          y: draggableProps.layout.scale.offset(transform).y,
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

  const [headerHeight, headerQueryRef] = useContainerQuery((entry) => entry.borderBoxHeight);
  const scaledSize = draggableProps.layout ? draggableProps.layout.scale.size(itemSize) : undefined;
  let maxContentWidth = scaledSize ? scaledSize.width : undefined;
  let maxContentHeight = scaledSize ? scaledSize.height - (headerHeight || 0) : undefined;
  if (transition?.sizeOverride) {
    maxContentWidth = transition.sizeOverride.width;
    maxContentHeight = transition.sizeOverride.height - (headerHeight || 0);
  }

  return (
    <div ref={itemRef} className={clsx(styles.root, currentIsDragging && styles.wrapperDragging)} style={style}>
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
                onPointerDown={(coordinates) => draggableProps.startMove(coordinates)}
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
      {draggableProps.layout && (
        <div className={styles.resizer}>
          <ResizeHandle
            ariaLabel={i18nStrings.resizeLabel}
            onPointerDown={(coordinates) => draggableProps.startResize(coordinates)}
          />
        </div>
      )}
    </div>
  );
}
