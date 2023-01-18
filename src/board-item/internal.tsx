// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { useId } from "react";
import DragHandle from "../internal/drag-handle";
import { useItemContext } from "../internal/item-container";
import ResizeHandle from "../internal/resize-handle";
import ScreenreaderOnly from "../internal/screenreader-only";
import WidgetContainerHeader from "./header";
import type { BoardItemProps } from "./interfaces";
import styles from "./styles.css.js";

export function InternalBoardItem({
  children,
  header,
  settings,
  disableContentPaddings,
  footer,
  i18nStrings,
}: BoardItemProps) {
  const { dragHandle, resizeHandle } = useItemContext();

  const dragHandleAriaLabelledBy = useId();
  const dragHandleAriaDescribedBy = useId();

  const resizeHandleAriaLabelledBy = useId();
  const resizeHandleAriaDescribedBy = useId();

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
                ariaLabelledBy={dragHandleAriaLabelledBy}
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
            ariaLabelledBy={resizeHandleAriaLabelledBy}
            ariaDescribedBy={resizeHandleAriaDescribedBy}
            onPointerDown={resizeHandle.onPointerDown}
            onKeyDown={resizeHandle.onKeyDown}
          />
        </div>
      )}

      <ScreenreaderOnly id={dragHandleAriaLabelledBy}>{i18nStrings.dragHandleAriaLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={dragHandleAriaDescribedBy}>{i18nStrings.dragHandleAriaDescription}</ScreenreaderOnly>

      <ScreenreaderOnly id={resizeHandleAriaLabelledBy}>{i18nStrings.resizeHandleAriaLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={resizeHandleAriaDescribedBy}>{i18nStrings.resizeHandleAriaDescription}</ScreenreaderOnly>
    </div>
  );
}
