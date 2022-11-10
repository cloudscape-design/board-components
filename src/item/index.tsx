// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { useDraggable } from "@dnd-kit/core";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties } from "react";
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
  const { id, transform } = useItemContext();
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    transform: dragTransform,
    active,
    isDragging,
  } = useDraggable({ id });

  const style: CSSProperties = {
    transform: CSSUtil.Translate.toString(dragTransform ?? transform),
    transition:
      !dragTransform && active
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
  };
  return (
    <div
      ref={setDragRef}
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
      <div className={styles.resizer}>
        <ResizeHandle ariaLabel={i18nStrings.resizeLabel} />
      </div>
    </div>
  );
}
