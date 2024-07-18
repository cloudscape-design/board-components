// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useId } from "react";
import clsx from "clsx";

import Container from "@cloudscape-design/components/container";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
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
  __internalRootRef,
  ...rest
}: BoardItemProps & InternalBaseComponentProps) {
  const { dragHandle, resizeHandle, isActive } = useItemContext();

  const dragHandleAriaLabelledBy = useId();
  const dragHandleAriaDescribedBy = useId();

  const resizeHandleAriaLabelledBy = useId();
  const resizeHandleAriaDescribedBy = useId();

  return (
    <div ref={__internalRootRef} className={styles.root} {...getDataAttributes(rest)}>
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
                isActive={dragHandle.isActive}
              />
            }
            settings={settings}
          >
            {header}
          </WidgetContainerHeader>
        }
        footer={footer}
        disableContentPaddings={disableContentPaddings}
        className={clsx(styles["container-override"], isActive && styles.active)}
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
            isActive={resizeHandle.isActive}
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
