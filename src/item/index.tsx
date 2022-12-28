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
  i18nStrings,
  disableContentPaddings,
  footer,
}: DashboardItemProps) {
  const { dragHandle, resizeHandle, positionDescription } = useItemContext();

  const dragHandleLabelId = useUniqueId("drag-handle-label-");
  const resizeHandleLabelId = useUniqueId("resize-handle-label-");
  const positionDescriptionId = useUniqueId("position-description-");
  const headerId = useUniqueId("header-");

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
                ariaLabelledBy={`${dragHandleLabelId} ${headerId} ${positionDescriptionId}`}
                onPointerDown={dragHandle.onPointerDown}
                onKeyDown={dragHandle.onKeyDown}
              />
            }
            settings={settings}
          >
            <div id={headerId}>{header}</div>
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
            ariaLabelledBy={`${resizeHandleLabelId} ${headerId} ${positionDescriptionId}`}
            onPointerDown={resizeHandle.onPointerDown}
            onKeyDown={resizeHandle.onKeyDown}
          />
        </div>
      )}

      <ScreenreaderOnly id={dragHandleLabelId}>{i18nStrings.dragHandleLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={resizeHandleLabelId}>{i18nStrings.resizeHandleLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={positionDescriptionId}>{positionDescription}</ScreenreaderOnly>
    </div>
  );
}
