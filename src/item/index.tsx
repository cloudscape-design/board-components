// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import DragHandle from "../internal/drag-handle";
import { useItemContext } from "../internal/item-container";
import ResizeHandle from "../internal/resize-handle";
import ScreenreaderOnly from "../internal/screenreader-only";
import { useUniqueId } from "../internal/utils/use-unique-id";
import WidgetContainerHeader from "./header";
import type { DashboardItemProps } from "./interfaces";
import styles from "./styles.css.js";

export type { DashboardItemProps };

export default function DashboardItem({
  children,
  header,
  settings,
  disableContentPaddings,
  footer,
}: DashboardItemProps) {
  const { dragHandle, resizeHandle, dragActive } = useItemContext();

  const dragHandleAriaLabelledBy = useUniqueId("drag-aria-label-");
  const dragHandleAriaLabelledByActive = useUniqueId("drag-aria-label-active-");
  const dragHandleAriaDescribedBy = useUniqueId("drag-aria-description-");

  const resizeHandleAriaLabelledBy = useUniqueId("resize-aria-label-");
  const resizeHandleAriaLabelledByActive = useUniqueId("resize-aria-label-active-");
  const resizeHandleAriaDescribedBy = useUniqueId("resize-aria-description-");

  return (
    <div className={styles.root}>
      <Container
        fitHeight={true}
        disableHeaderPaddings={true}
        header={
          <WidgetContainerHeader
            handle={
              <DragHandle
                ref={dragHandle.ref}
                ariaLabelledBy={dragActive ? dragHandleAriaLabelledByActive : dragHandleAriaLabelledBy}
                ariaDescribedBy={dragHandleAriaDescribedBy}
                onPointerDown={dragHandle.onPointerDown}
                onKeyDown={dragHandle.onKeyDown}
              />
            }
            settings={settings}
          >
            {header}
          </WidgetContainerHeader>
        }
        footer={footer}
        disableContentPaddings={disableContentPaddings}
      >
        {children}
      </Container>
      {resizeHandle && (
        <div className={styles.resizer}>
          <ResizeHandle
            ariaLabelledBy={dragActive ? resizeHandleAriaLabelledByActive : resizeHandleAriaLabelledBy}
            ariaDescribedBy={resizeHandleAriaDescribedBy}
            onPointerDown={resizeHandle.onPointerDown}
            onKeyDown={resizeHandle.onKeyDown}
          />
        </div>
      )}

      <ScreenreaderOnly id={dragHandleAriaLabelledBy}>{dragHandle.ariaLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={dragHandleAriaLabelledByActive}>{dragHandle.ariaLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={dragHandleAriaDescribedBy}>{dragHandle.ariaDescription}</ScreenreaderOnly>

      <ScreenreaderOnly id={resizeHandleAriaLabelledBy}>{resizeHandle?.ariaLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={resizeHandleAriaLabelledByActive}>{resizeHandle?.ariaLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={resizeHandleAriaDescribedBy}>{resizeHandle?.ariaDescription}</ScreenreaderOnly>
    </div>
  );
}
