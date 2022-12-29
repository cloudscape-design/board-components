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
  const { dragHandle, resizeHandle } = useItemContext();

  const dragInteractionDescriptionId = useUniqueId("drag-interaction-description-");
  const resizeInteractionDescriptionId = useUniqueId("resize-interaction-description-");

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
                ariaLabel={dragHandle.ariaLabel}
                ariaDescribedBy={dragInteractionDescriptionId}
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
            ariaLabel={resizeHandle.ariaLabel}
            ariaDescribedBy={resizeInteractionDescriptionId}
            onPointerDown={resizeHandle.onPointerDown}
            onKeyDown={resizeHandle.onKeyDown}
          />
        </div>
      )}

      <ScreenreaderOnly id={dragInteractionDescriptionId}>{dragHandle.ariaDescription}</ScreenreaderOnly>
      <ScreenreaderOnly id={resizeInteractionDescriptionId}>{resizeHandle?.ariaDescription}</ScreenreaderOnly>
    </div>
  );
}
