// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { useDndContext, useDraggable } from "@dnd-kit/core";
import { CSS as CSSUtil, useCombinedRefs } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties, useRef } from "react";
import DragHandle from "../internal/drag-handle";
import { useItemContext } from "../internal/item-context";
import ResizeHandle from "../internal/resize-handle";
import WidgetContainerHeader from "./header";
import type { DashboardItemProps } from "./interfaces";
import styles from "./styles.css.js";

export type { DashboardItemProps };

export default function DashboardItem({
  children,
  header,
  settings,
  i18nStrings,
  ...containerProps
}: DashboardItemProps) {
  const { draggableNodes } = useDndContext();
  const elementRef = useRef<HTMLElement>();
  const { id, transform, resizable } = useItemContext();
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    transform: dragTransform,
    active,
    isDragging,
  } = useDraggable({
    id,
    // put draggable nodes to be used in collision check. The object is mutable.
    data: { draggableNodes, elementRef },
  });

  const style: CSSProperties = {
    transform: CSSUtil.Translate.toString((!resizable && dragTransform) || transform),
    opacity: isDragging && resizable ? 0 : 1,
    transition:
      active && resizable
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
  };
  return (
    <div
      ref={useCombinedRefs(setDragRef, (newNode) => (elementRef.current = newNode ?? undefined))}
      {...attributes}
      className={clsx(styles.wrapper, isDragging && styles.wrapperDragging)}
      style={style}
      // override attributes coming from dnd-kit
      tabIndex={undefined}
      role={undefined}
    >
      <Container
        {...containerProps}
        disableHeaderPaddings={true}
        header={
          <WidgetContainerHeader
            handle={<DragHandle listeners={listeners} ariaLabel={i18nStrings.dragHandleLabel} />}
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
          <ResizeHandle ariaLabel={i18nStrings.resizeLabel} />
        </div>
      )}
    </div>
  );
}
