// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import clsx from "clsx";
import { CSSProperties } from "react";
import { useDraggable } from "../internal/dnd";
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
  const { id, transform, resizable } = useItemContext();
  const { ref, onStart, transform: dragTransform, activeDragId } = useDraggable(id);
  const currentIsDragging = activeDragId === id;

  const style: CSSProperties = {
    transform: CSSUtil.Translate.toString(dragTransform ?? transform),
    transition:
      activeDragId && !currentIsDragging
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
  };
  return (
    <div ref={ref} className={clsx(styles.wrapper, currentIsDragging && styles.wrapperDragging)} style={style}>
      <Container
        {...containerProps}
        disableHeaderPaddings={true}
        header={
          <WidgetContainerHeader
            handle={<DragHandle listeners={{ onMouseDown: onStart }} ariaLabel={i18nStrings.dragHandleLabel} />}
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
