// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useId } from "react";
import clsx from "clsx";

import Container from "@cloudscape-design/components/container";
import { InternalDragHandleProps } from "@cloudscape-design/components/internal/do-not-use/drag-handle";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import DragHandle from "../internal/drag-handle";
import { Direction } from "../internal/interfaces";
import { useItemContext } from "../internal/item-container";
import ResizeHandle from "../internal/resize-handle";
import ScreenreaderOnly from "../internal/screenreader-only";
import WidgetContainerHeader from "./header";
import type { BoardItemProps } from "./interfaces";

import styles from "./styles.css.js";

const mapToKeyboardDirection = (direction: InternalDragHandleProps.Direction) => {
  const directionMap: Record<InternalDragHandleProps.Direction, Direction> = {
    "inline-start": "left",
    "inline-end": "right",
    "block-start": "up",
    "block-end": "down",
  };
  return directionMap[direction];
};

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
  const { dragHandle, resizeHandle, isActive, isHidden } = useItemContext();

  const dragHandleAriaLabelledBy = useId();
  const dragHandleAriaDescribedBy = useId();

  const resizeHandleAriaLabelledBy = useId();
  const resizeHandleAriaDescribedBy = useId();

  // A board item is hidden while moving a board item from the palette to the board via keyboard or UAP.
  // The wrapping container is set to invisible, so we don't need to render anything.
  if (isHidden) {
    return null;
  }

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
                activeState={dragHandle.activeState}
                initialShowButtons={dragHandle.initialShowButtons}
                onDirectionClick={(direction) => dragHandle.onDirectionClick(mapToKeyboardDirection(direction), "drag")}
                dragHandleTooltipText={i18nStrings.dragHandleTooltipText}
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
      {resizeHandle && !isHidden && (
        <div className={styles.resizer}>
          <ResizeHandle
            ariaLabelledBy={resizeHandleAriaLabelledBy}
            ariaDescribedBy={resizeHandleAriaDescribedBy}
            onPointerDown={resizeHandle.onPointerDown}
            onKeyDown={resizeHandle.onKeyDown}
            activeState={resizeHandle.activeState}
            onDirectionClick={(direction) => {
              resizeHandle.onDirectionClick(mapToKeyboardDirection(direction), "resize");
            }}
            resizeHandleTooltipText={i18nStrings.resizeHandleTooltipText}
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
